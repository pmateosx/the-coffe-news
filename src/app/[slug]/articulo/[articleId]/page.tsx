import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TransitionLink } from "@/components/view-transitions";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { StampBar } from "@/components/stamp-bar";
import { formatLongDate } from "@/lib/dates";
import { SECTION_LABELS } from "@/lib/labels";
import { renderBasicMarkdown } from "@/lib/markdown";
import { getRoomBySlug, getSessionMember } from "@/lib/room";
import { summarizeStamps } from "@/lib/stamps";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string; articleId: string }>;
}) {
  const { slug, articleId } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);
  if (!member) redirect(`/${room.slug}`);

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.roomId, room.id)),
    with: { author: true, stamps: true },
  });
  if (!article) notFound();

  const isAuthor = article.authorMemberId === member.id;
  const isAdmin = member.role === "admin";
  const editable =
    !article.archived && article.editionNumber === room.editionNumber;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <nav className="flex items-center justify-between">
        <TransitionLink
          href={
            article.archived
              ? `/${room.slug}/archivo/${article.editionNumber}`
              : `/${room.slug}`
          }
          className="text-sm text-faded hover:text-ink"
        >
          {article.archived
            ? `← Edición Nº${article.editionNumber} (hemeroteca)`
            : "← Volver a portada"}
        </TransitionLink>
        <div className="flex gap-2">
          {isAuthor && editable && (
            <Link
              href={`/${room.slug}/articulo/${article.id}/editar`}
              className="border border-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide hover:bg-paper-dark"
            >
              Editar
            </Link>
          )}
          {(isAdmin || (isAuthor && editable)) && (
            <DeleteArticleButton slug={room.slug} articleId={article.id} />
          )}
        </div>
      </nav>

      <article className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {SECTION_LABELS[article.section]}
          {article.archived && " · Edición archivada"}
        </p>
        <h1
          className="mt-3 font-serif text-4xl font-black leading-tight sm:text-5xl"
          style={{ viewTransitionName: `article-title-${article.id}` }}
        >
          {article.title}
        </h1>
        {article.dek && (
          <p className="mt-4 font-serif text-xl italic text-faded">{article.dek}</p>
        )}
        <p className="mt-4 border-b border-rule pb-4 text-sm text-faded">
          Por{" "}
          <span className="font-semibold text-ink">
            {article.author.emoji} {article.author.displayName}
          </span>{" "}
          · Edición Nº{article.editionNumber} · {formatLongDate(article.createdAt)}
        </p>

        {article.coverImageUrl && (
          <div
            className="relative mt-6 aspect-[16/9] w-full overflow-hidden bg-paper-dark"
            style={{ viewTransitionName: `article-image-${article.id}` }}
          >
            <Image
              src={article.coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <div
          className="prose-newspaper mt-8 space-y-4 text-lg leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(article.body) }}
        />

        <footer className="mt-10 border-t border-rule pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-faded">
            Sellos de la redacción
          </p>
          <StampBar
            slug={room.slug}
            articleId={article.id}
            summary={summarizeStamps(article.stamps, member.id)}
            readOnly={article.archived}
          />
        </footer>
      </article>
    </main>
  );
}
