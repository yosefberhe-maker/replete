// TODO: Implement in Prompt 5
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container-page py-24">
      <h1 className="text-4xl font-extrabold">Replete</h1>
      <p className="mt-4 text-sub">Landing page placeholder.</p>
      <Link href="/intake" className="btn-primary mt-8 inline-flex">
        Get my plan
      </Link>
    </main>
  );
}
