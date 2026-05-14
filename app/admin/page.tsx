import Link from "next/link";
import { readWaitlist } from "@/lib/storage";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

interface AdminPageProps {
  searchParams: { key?: string };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const expected = process.env.ADMIN_KEY;
  const provided = searchParams.key;

  if (!expected) {
    return (
      <main className="container-page py-24">
        <h1 className="text-2xl font-bold text-text">Admin not configured</h1>
        <p className="mt-2 text-sub">
          Set <code className="text-text">ADMIN_KEY</code> in{" "}
          <code className="text-text">.env.local</code> to enable the admin
          dashboard, then visit{" "}
          <code className="text-text">/admin?key=YOUR_KEY</code>.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          Back to home
        </Link>
      </main>
    );
  }

  if (provided !== expected) {
    return <Forbidden />;
  }

  const entries = await readWaitlist();
  return <AdminDashboard entries={entries} />;
}

function Forbidden() {
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
      <Link href="/" className="btn-ghost mt-6 inline-flex">
        Back to home
      </Link>
    </main>
  );
}
