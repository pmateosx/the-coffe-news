import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, count, desc, eq, max, min } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { formatLongDate } from "@/lib/dates";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

export const metadata = { title: "Hemeroteca — The Coffee News" };

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);
  if (!member) redirect(`/${room.slug}`);

  const editions = await db
    .select({
      edition: articles.editionNumber,
      articleCount: count(),
      from: min(articles.createdAt),
      to: max(articles.createdAt),
    })
    .from(articles)
    .where(and(eq(articles.roomId, room.id), eq(articles.archived, true)))
    .groupBy(articles.editionNumber)
    .orderBy(desc(articles.editionNumber));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href={`/${room.slug}`} className="text-sm text-faded hover:text-ink">
        ← {room.name}
      </Link>
      <h1 className="mt-3 font-serif text-4xl font-black">Hemeroteca</h1>
      <p className="mt-2 text-faded">
        Las ediciones pasadas de {room.name}, en solo lectura.
      </p>
      <div className="double-rule my-6" />

      {editions.length === 0 ? (
        <p className="py-16 text-center font-serif text-xl italic text-faded">
          Aún no hay ediciones archivadas: la primera caducará a los 7 días.
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {editions.map((edition) => (
            <li key={edition.edition}>
              <Link
                href={`/${room.slug}/archivo/${edition.edition}`}
                className="group flex items-baseline justify-between gap-4 py-4"
              >
                <span>
                  <span className="font-serif text-2xl font-black group-hover:underline">
                    Edición Nº{edition.edition}
                  </span>
                  {edition.from && edition.to && (
                    <span className="ml-3 text-sm text-faded">
                      {formatLongDate(edition.from)} — {formatLongDate(edition.to)}
                    </span>
                  )}
                </span>
                <span className="text-sm text-faded">
                  {edition.articleCount}{" "}
                  {edition.articleCount === 1 ? "artículo" : "artículos"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
