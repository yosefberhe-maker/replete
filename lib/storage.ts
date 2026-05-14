import { promises as fs } from "node:fs";
import path from "node:path";
import type { DeficiencyProfile, IntakeData } from "@/types";

/**
 * Tiny JSON-file store for MVP. Each entry is appended; reads parse the
 * whole file. Fine for hundreds of signups — swap to Supabase before
 * thousands.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const WAITLIST_PATH = path.join(DATA_DIR, "waitlist.json");
export const REDDIT_POSTS_PATH = path.join(DATA_DIR, "reddit-posts.json");

export interface WaitlistEntry {
  email: string;
  timestamp: string;
  intake?: IntakeData;
  profile?: DeficiencyProfile;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJsonArray<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }
}

async function writeJsonArray<T>(filePath: string, data: T[]): Promise<void> {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function readWaitlist(): Promise<WaitlistEntry[]> {
  return readJsonArray<WaitlistEntry>(WAITLIST_PATH);
}

export async function appendWaitlistEntry(
  entry: WaitlistEntry,
): Promise<number> {
  const list = await readWaitlist();
  list.push(entry);
  await writeJsonArray(WAITLIST_PATH, list);
  return list.length;
}

export async function readRedditPosts<T>(): Promise<T[]> {
  return readJsonArray<T>(REDDIT_POSTS_PATH);
}

export async function appendRedditPost<T>(post: T): Promise<number> {
  const list = await readRedditPosts<T>();
  list.push(post);
  await writeJsonArray(REDDIT_POSTS_PATH, list);
  return list.length;
}
