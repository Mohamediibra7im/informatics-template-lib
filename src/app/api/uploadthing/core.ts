import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { getSessionFromCookie } from "@/lib/auth";
import { getDb } from "@/db";
import { users, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const f = createUploadthing();
const utapi = new UTApi();

function getUploadThingFileKey(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:utfs\.io|ufs\.sh)\/f\/([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];
  return null;
}

export const ourFileRouter = {
  avatarUploader: f({
    image: {
      maxFileSize: "1MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await getSessionFromCookie();
      if (!session) throw new UploadThingError("Unauthorized");

      const db = getDb();
      let usernameStr = `user_${session.userId}`;
      let oldFileKey: string | null = null;

      if (db) {
        const [u] = await db
          .select({ username: users.username, avatarUrl: userProfiles.avatarUrl })
          .from(users)
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(eq(users.id, session.userId))
          .limit(1);

        if (u?.username) {
          usernameStr = u.username.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
        }
        if (u?.avatarUrl) {
          oldFileKey = getUploadThingFileKey(u.avatarUrl);
        }
      }

      return { userId: session.userId, customFileName: `${usernameStr}_avatar`, oldFileKey };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Automatically delete previous UploadThing avatar file if present
      if (metadata.oldFileKey) {
        try {
          await utapi.deleteFiles(metadata.oldFileKey);
        } catch {
          // Non-blocking cleanup catch
        }
      }

      return {
        uploadedBy: metadata.userId,
        customName: metadata.customFileName,
        url: file.ufsUrl || file.url,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
