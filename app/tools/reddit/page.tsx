import Link from "next/link";
import RedditGenerator from "@/components/RedditGenerator";
import { readRedditPosts } from "@/lib/storage";
import { RepleteWordmark } from "@/components/RepleteWordmark";

export const dynamic = "force-dynamic";

interface RedditPageProps {
  searchParams: { key?: string };
}

interface RedditPostRecord {
  templateId: string;
  drug: string;
  duration: string;
  topic: string;
  includeReplete: boolean;
  body: string;
  timestamp: string;
}

export default async function RedditToolPage({ searchParams }: RedditPageProps) {
  const expected = process.env.ADMIN_KEY;
  const provided = searchParams.key;

  if (!expected) {
    return (
      <main className="container-page py-24">
        <h1 className="text-2xl font-bold text-text">
          Reddit tool not configured
        </h1>
        <p className="mt-2 text-sub">
          Set <code className="text-text">ADMIN_KEY</code> in{" "}
          <code className="text-text">.env.local</code> then visit{" "}
          <code className="text-text">/tools/reddit?key=YOUR_KEY</code>.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          Back to home
        </Link>
      </main>
    );
  }
  if (provided !== expected) {
    return (
      <main className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-red">
          403
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text">
          Forbidden
        </h1>
        <p className="mt-2 text-sub">
          Append a valid <code className="text-text">?key=</code> parameter.
        </p>
      </main>
    );
  }

  const history = await readRedditPosts<RedditPostRecord>();

  return (
    <main className="container-page py-8">
      <header className="flex items-center justify-between">
        <RepleteWordmark />
        <span className="text-xs text-muted">Internal · do not share</span>
      </header>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text">
        Reddit content generator
      </h1>
      <p className="text-sub">
        Generate genuinely helpful answers for r/Semaglutide, r/Ozempic,
        r/WegovyWeightLoss, r/Mounjaro. Lead with information. Marketing
        language gets banned.
      </p>
      <RedditGenerator adminKey={expected} history={history} />
    </main>
  );
}
