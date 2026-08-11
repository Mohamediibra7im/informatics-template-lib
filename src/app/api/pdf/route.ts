import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Topic {
  title?: string;
  complexity?: string;
  hash?: string;
  language?: string;
  code?: string;
  notes?: string;
}
interface Section {
  title?: string;
  topics?: Topic[];
}
interface Payload {
  title?: string;
  subtitle?: string;
  date?: string;
  options?: Record<string, unknown>;
  sections?: Section[];
}

export async function POST(request: Request) {
  const serviceUrl = process.env.PDF_SERVICE_URL;
  if (!serviceUrl) {
    return NextResponse.json({ error: "PDF service not configured" }, { status: 500 });
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Defensive validation (public POST convention)
  if (!payload || !Array.isArray(payload.sections)) {
    return NextResponse.json({ error: "sections required" }, { status: 400 });
  }
  const topicCount = payload.sections.reduce(
    (n, s) => n + (Array.isArray(s.topics) ? s.topics.length : 0),
    0
  );
  if (topicCount === 0) {
    return NextResponse.json({ error: "no topics to render" }, { status: 400 });
  }

  try {
    const res = await fetch(`${serviceUrl.replace(/\/$/, "")}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // compile can take a few seconds on cold start
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "PDF generation failed" }, { status: 502 });
    }

    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buf.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF service unavailable" }, { status: 502 });
  }
}
