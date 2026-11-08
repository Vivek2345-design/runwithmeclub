import Link from "next/link";

export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="container-x max-w-3xl py-14">
      <Link href="/" className="text-sm text-muted hover:text-ink">&larr; Home</Link>
      <h1 className="mt-3 text-4xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated {updated}</p>
      <div className="prose-club mt-8">{children}</div>
    </article>
  );
}
