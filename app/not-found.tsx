import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-green">
        Replete
      </p>
      <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-text sm:text-6xl">
        404
      </h1>
      <p className="mt-3 max-w-md text-sub">
        We couldn&apos;t find that page. The clinical literature on this URL is
        sparse.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/intake" className="btn-ghost">
          Take the intake
        </Link>
      </div>
    </main>
  );
}
