import { NextResponse } from "next/server";
import { appendRedditPost, readRedditPosts } from "@/lib/storage";
import {
  REDDIT_TEMPLATES,
  generateRedditPost,
  type RedditTemplateId,
} from "@/lib/reddit-templates";
import type { Drug, Duration } from "@/types";

export const runtime = "nodejs";

interface RedditPostRecord {
  templateId: RedditTemplateId;
  drug: Drug;
  duration: Duration;
  topic: string;
  includeReplete: boolean;
  body: string;
  timestamp: string;
}

function gateOk(req: Request): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  const url = new URL(req.url);
  return url.searchParams.get("key") === expected;
}

export async function GET(req: Request): Promise<Response> {
  if (!gateOk(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const posts = await readRedditPosts<RedditPostRecord>();
  return NextResponse.json({ posts });
}

export async function POST(req: Request): Promise<Response> {
  if (!gateOk(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const d = body as Partial<RedditPostRecord>;
  const validTemplates = REDDIT_TEMPLATES.map((t) => t.id);
  if (!d.templateId || !validTemplates.includes(d.templateId)) {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }
  const drug = (d.drug ?? "sema") as Drug;
  const duration = (d.duration ?? "3-6") as Duration;
  const topic = (d.topic ?? "").toString().slice(0, 500);
  const includeReplete = Boolean(d.includeReplete);

  const text = generateRedditPost({
    templateId: d.templateId,
    drug,
    duration,
    topic,
    includeReplete,
  });

  const record: RedditPostRecord = {
    templateId: d.templateId,
    drug,
    duration,
    topic,
    includeReplete,
    body: text,
    timestamp: new Date().toISOString(),
  };
  await appendRedditPost(record);

  return NextResponse.json({ post: record });
}
