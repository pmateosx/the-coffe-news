import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { ArticleForm } from "@/components/article-form";
import { DeleteArticleButton } from "@/components/delete-article-button";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

export const metadata = { title: "Editar artículo — The Coffee News" };

export default async function EditArticlePage({
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
  });
  if (!article) notFound();

  const editable =
    !article.archived && article.editionNumber === room.editionNumber;
  if (article.authorMemberId !== member.id || !editable) {
    redirect(`/${room.slug}/articulo/${article.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/${room.slug}/articulo/${article.id}`}
        className="text-sm text-faded hover:text-ink"
      >
        ← Volver al artículo
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-4xl font-black">Editar artículo</h1>
        <DeleteArticleButton slug={room.slug} articleId={article.id} />
      </div>
      <div className="double-rule my-6" />
      <ArticleForm slug={room.slug} article={article} />
    </main>
  );
}
