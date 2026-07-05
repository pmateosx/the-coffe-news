import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleForm } from "@/components/article-form";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

export const metadata = { title: "Escribir noticia — The Coffee News" };

export default async function WritePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);
  if (!member) redirect(`/${room.slug}`);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href={`/${room.slug}`} className="text-sm text-faded hover:text-ink">
        ← {room.name}
      </Link>
      <h1 className="mt-3 font-serif text-4xl font-black">Escribir noticia</h1>
      <p className="mt-2 text-faded">
        Saldrá en la edición Nº{room.editionNumber} firmada como {member.emoji}{" "}
        {member.displayName}.
      </p>
      <div className="double-rule my-6" />
      <ArticleForm slug={room.slug} />
    </main>
  );
}
