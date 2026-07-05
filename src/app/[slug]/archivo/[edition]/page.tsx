import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, type SizeHint } from "@/db/schema";
import { ArticleCard } from "@/components/article-card";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

const GRID_SPAN: Record<SizeHint, string> = {
  destacado: "sm:col-span-2 lg:col-span-2",
  normal: "",
  mini: "",
};

export default async function ArchivedEditionPage({
  params,
}: {
  params: Promise<{ slug: string; edition: string }>;
}) {
  const { slug, edition } = await params;
  const editionNumber = Number.parseInt(edition, 10);
  if (!Number.isInteger(editionNumber) || editionNumber < 1) notFound();

  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);
  if (!member) redirect(`/${room.slug}`);

  const editionArticles = await db.query.articles.findMany({
    where: and(
      eq(articles.roomId, room.id),
      eq(articles.editionNumber, editionNumber),
      eq(articles.archived, true),
    ),
    with: { author: true, stamps: true },
    orderBy: [desc(articles.createdAt)],
  });
  if (editionArticles.length === 0) notFound();

  const sorted = [...editionArticles].sort((a, b) => {
    const lead = (x: typeof a) => (x.sizeHint === "destacado" ? 0 : 1);
    return lead(a) - lead(b) || b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <header className="text-center">
        <div className="flex items-baseline justify-between border-b border-rule pb-1 text-[0.65rem] uppercase tracking-widest text-faded">
          <Link href={`/${room.slug}/archivo`} className="hover:text-ink">
            ← Hemeroteca
          </Link>
          <span className="font-bold">The Coffee News</span>
          <span className="text-accent">Edición cerrada</span>
        </div>
        <h1 className="mt-6 font-serif text-5xl font-black tracking-tight sm:text-6xl">
          {room.name}
        </h1>
        <p className="mt-3 text-xs uppercase tracking-widest text-faded">
          Edición Nº{editionNumber} · archivada · solo lectura
        </p>
        <div className="double-rule mt-4" />
      </header>

      <section className="mt-8 grid grid-flow-dense grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {sorted.map((article) => (
          <ArticleCard
            key={article.id}
            slug={room.slug}
            article={article}
            className={GRID_SPAN[article.sizeHint]}
          />
        ))}
      </section>
    </main>
  );
}
