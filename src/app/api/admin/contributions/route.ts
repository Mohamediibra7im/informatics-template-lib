import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendApprovalEmail, sendRejectionEmail, sendChangesRequestedEmail } from "@/lib/email";
import { snapshotTemplate } from "@/lib/template-history";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const rows = await db.query.contributions.findMany({
    with: { category: true, template: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  return NextResponse.json(rows);
}

export async function DELETE(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const [contribution] = await db
    .select()
    .from(schema.contributions)
    .where(eq(schema.contributions.id, Number(id)));

  if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 });

  // Approved contribution tied to a template: undo its effect on delete.
  if (contribution.status === "approved" && contribution.templateId) {
    const [tpl] = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.id, contribution.templateId));

    if (tpl && contribution.type === "edit") {
      // Auto-revert: restore the template to the state captured right BEFORE
      // this contributor's edit was applied (linked via contributionId).
      const [snap] = await db
        .select()
        .from(schema.templateHistory)
        .where(
          and(
            eq(schema.templateHistory.templateId, contribution.templateId),
            eq(schema.templateHistory.contributionId, contribution.id)
          )
        )
        .orderBy(desc(schema.templateHistory.id));

      if (snap) {
        // Safety snapshot of the current state so the delete-revert is undoable.
        await snapshotTemplate(db, contribution.templateId, "Before contribution delete");

        try {
          await db
            .update(schema.templates)
            .set({
              title: snap.title,
              slug: snap.slug,
              description: snap.description,
              categoryId: snap.categoryId ?? tpl.categoryId,
              tags: snap.tags,
              complexity: snap.complexity,
              notes: snap.notes,
              hidden: snap.hidden,
              contributorName: snap.contributorName,
              contributorCfHandle: snap.contributorCfHandle,
              updatedAt: new Date(),
            })
            .where(eq(schema.templates.id, contribution.templateId));

          const codes = (snap.codes as Array<{ language: string; code: string }> | null) || [];
          await db.delete(schema.templateCodes).where(eq(schema.templateCodes.templateId, contribution.templateId));
          if (codes.length > 0) {
            await db.insert(schema.templateCodes).values(
              codes.map((c) => ({ templateId: contribution.templateId!, language: c.language, code: c.code }))
            );
          }

          revalidatePath("/");
          revalidatePath("/templates");
          revalidatePath(`/template/${snap.slug}`);
          if (tpl.slug !== snap.slug) revalidatePath(`/template/${tpl.slug}`);
        } catch (e) {
          console.error("Failed to auto-revert on contribution delete:", e);
          return NextResponse.json(
            { error: "Could not auto-revert this edit — the saved slug may now conflict. Delete blocked." },
            { status: 500 }
          );
        }
      }

      // Remove this contributor's history snapshot(s) so no trace remains.
      await db.delete(schema.templateHistory).where(eq(schema.templateHistory.contributionId, contribution.id));
    } else if (tpl && contribution.type === "new") {
      // A "new" submission created the template — don't delete the published
      // template, just strip the credit if it still points at this contributor.
      if (
        tpl.contributorName === contribution.contributorName &&
        (tpl.contributorCfHandle || null) === (contribution.contributorCfHandle || null)
      ) {
        await db
          .update(schema.templates)
          .set({ contributorName: null, contributorCfHandle: null })
          .where(eq(schema.templates.id, contribution.templateId));
        revalidatePath(`/template/${tpl.slug}`);
        revalidatePath("/templates");
      }
    }
  }

  await db.delete(schema.contributions).where(eq(schema.contributions.id, Number(id)));

  return NextResponse.json({ message: "Contribution deleted" });
}

export async function PUT(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 500 });

  const body = await request.json();
  const { id, action, adminNote } = body;

  if (!id || !["approve", "reject", "request_changes"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "request_changes" && !adminNote?.trim()) {
    return NextResponse.json({ error: "A message describing the requested changes is required" }, { status: 400 });
  }

  const [contribution] = await db
    .select()
    .from(schema.contributions)
    .where(eq(schema.contributions.id, Number(id)));

  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
  }

  if (contribution.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  if (action === "approve") {
    if (contribution.type === "new") {
      const baseSlug =
        contribution.slug ||
        (contribution.title || "untitled")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      // Ensure slug is unique — suffix -2, -3, ... on collision
      let slug = baseSlug;
      let suffix = 2;
      while (true) {
        const [clash] = await db
          .select({ id: schema.templates.id })
          .from(schema.templates)
          .where(eq(schema.templates.slug, slug));
        if (!clash) break;
        slug = `${baseSlug}-${suffix++}`;
      }

      let newTemplate;
      try {
        [newTemplate] = await db
          .insert(schema.templates)
          .values({
            title: contribution.title || "Untitled",
            slug,
            description: contribution.description || "",
            categoryId: contribution.categoryId || 1,
            tags: (contribution.tags as string[]) || [],
            complexity: contribution.complexity || "",
            notes: contribution.notes || null,
            contributorName: contribution.contributorName,
            contributorCfHandle: contribution.contributorCfHandle || null,
          })
          .returning();
      } catch (e) {
        console.error("Failed to insert approved template:", e);
        return NextResponse.json(
          { error: "Failed to publish template. Check the category exists and the slug is valid." },
          { status: 500 }
        );
      }

      const codes = (contribution.codes as Array<{ language: string; code: string }>) || [];
      if (codes.length > 0) {
        await db.insert(schema.templateCodes).values(
          codes.map((c) => ({
            templateId: newTemplate.id,
            language: c.language,
            code: c.code,
          }))
        );
      }

      await db
        .update(schema.contributions)
        .set({ status: "approved", adminNote: adminNote || null, reviewedAt: new Date(), templateId: newTemplate.id })
        .where(eq(schema.contributions.id, Number(id)));

      try {
        await sendApprovalEmail(
          contribution.contributorEmail,
          contribution.contributorName,
          contribution.title || "Untitled",
          slug,
          "new"
        );
      } catch (e) {
        console.error("Failed to send approval email:", e);
      }

      revalidatePath("/");
      revalidatePath("/templates");
      revalidatePath(`/template/${slug}`);

      return NextResponse.json({ message: "Approved and published", templateId: newTemplate.id });
    }

    if (contribution.type === "edit" && contribution.templateId) {
      const [existingTemplate] = await db
        .select()
        .from(schema.templates)
        .where(eq(schema.templates.id, contribution.templateId));

      if (!existingTemplate) {
        return NextResponse.json({ error: "Target template not found" }, { status: 404 });
      }

      // Snapshot current version before applying the contributed edit.
      // Linked to this contribution so it can be undone precisely on delete.
      await snapshotTemplate(
        db,
        contribution.templateId,
        `Before edit by ${contribution.contributorName}`,
        contribution.id
      );

      const updates: Record<string, unknown> = {
        contributorName: contribution.contributorName,
        contributorCfHandle: contribution.contributorCfHandle || null,
        updatedAt: new Date(),
      };

      if (contribution.editNotes) {
        updates.notes = contribution.editNotes;
      }

      await db
        .update(schema.templates)
        .set(updates)
        .where(eq(schema.templates.id, contribution.templateId));

      const editCodes = contribution.editCodes as Array<{ language: string; code: string }> | null;
      if (editCodes && editCodes.length > 0) {
        await db
          .delete(schema.templateCodes)
          .where(eq(schema.templateCodes.templateId, contribution.templateId));

        await db.insert(schema.templateCodes).values(
          editCodes.map((c) => ({
            templateId: contribution.templateId!,
            language: c.language,
            code: c.code,
          }))
        );
      }

      await db
        .update(schema.contributions)
        .set({ status: "approved", adminNote: adminNote || null, reviewedAt: new Date() })
        .where(eq(schema.contributions.id, Number(id)));

      try {
        await sendApprovalEmail(
          contribution.contributorEmail,
          contribution.contributorName,
          existingTemplate.title,
          existingTemplate.slug,
          "edit"
        );
      } catch (e) {
        console.error("Failed to send approval email:", e);
      }

      revalidatePath(`/template/${existingTemplate.slug}`);
      revalidatePath("/templates");

      return NextResponse.json({ message: "Edit approved and applied" });
    }
  }

  if (action === "request_changes") {
    await db
      .update(schema.contributions)
      .set({ status: "changes_requested", adminNote: adminNote.trim(), reviewedAt: new Date() })
      .where(eq(schema.contributions.id, Number(id)));

    try {
      await sendChangesRequestedEmail(
        contribution.contributorEmail,
        contribution.contributorName,
        contribution.title || (contribution.type === "edit" ? "Edit Request" : "Untitled"),
        adminNote.trim(),
        contribution.type as "new" | "edit",
        contribution.id
      );
    } catch (e) {
      console.error("Failed to send changes-requested email:", e);
    }

    return NextResponse.json({ message: "Changes requested" });
  }

  if (action === "reject") {
    await db
      .update(schema.contributions)
      .set({ status: "rejected", adminNote: adminNote || null, reviewedAt: new Date() })
      .where(eq(schema.contributions.id, Number(id)));

    try {
      await sendRejectionEmail(
        contribution.contributorEmail,
        contribution.contributorName,
        contribution.title || "Edit Request",
        adminNote
      );
    } catch (e) {
      console.error("Failed to send rejection email:", e);
    }

    return NextResponse.json({ message: "Contribution rejected" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
