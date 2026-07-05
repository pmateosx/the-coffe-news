import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, roomMembers, type SizeHint } from "@/db/schema";
import { ArticleCard } from "@/components/article-card";
import { KickButton } from "@/components/kick-button";
import { Masthead } from "@/components/masthead";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

const GRID_SPAN: Record<SizeHint, string> = {
  destacado: "sm:col-span-2 lg:col-span-2",
  normal: "",
  mini: "",
};

export default async function RoomHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);

  if (!member) {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-faded">The Coffee News</p>
        <h1 className="mt-2 font-serif text-4xl font-black">{room.name}</h1>
        <div className="double-rule my-6" />
        <p className="text-faded">
          Este periódico es privado: solo su redacción puede leerlo.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/entrar?room=${room.slug}`}
            className="bg-ink px-4 py-3 font-semibold text-paper hover:bg-accent"
          >
            Entrar con mi código secreto
          </Link>
          <p className="text-sm text-faded">
            ¿Aún no eres miembro? Pide a un compañero el link de invitación.
          </p>
        </div>
      </main>
    );
  }

  const [editionArticles, members] = await Promise.all([
    db.query.articles.findMany({
      where: and(
        eq(articles.roomId, room.id),
        eq(articles.editionNumber, room.editionNumber),
        eq(articles.archived, false),
      ),
      with: { author: true, stamps: true },
      orderBy: [desc(articles.createdAt)],
    }),
    db.query.roomMembers.findMany({
      where: eq(roomMembers.roomId, room.id),
      orderBy: [roomMembers.createdAt],
    }),
  ]);

  // Portada curada: los destacados abren el periódico, luego el resto por fecha.
  const sorted = [...editionArticles].sort((a, b) => {
    const lead = (x: typeof a) => (x.sizeHint === "destacado" ? 0 : 1);
    return lead(a) - lead(b) || b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <Masthead room={room} member={member} memberCount={members.length} />

      {sorted.length === 0 ? (
        <section className="py-20 text-center text-faded">
          <p className="font-serif text-2xl italic">Esta edición está en blanco.</p>
          <p className="mt-2 text-sm">
            Sé quien dé la exclusiva: escribe la primera noticia.
          </p>
        </section>
      ) : (
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
      )}

      {member.role === "admin" && (
        <footer className="mt-16 border-t border-rule pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-faded">
            Redacción ({members.length}) — solo tú ves este panel
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span>
                  {m.emoji} {m.displayName}
                  {m.role === "admin" ? " (editor)" : ""}
                </span>
                {m.id !== member.id && (
                  <KickButton slug={room.slug} memberId={m.id} displayName={m.displayName} />
                )}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </main>
  );
}
