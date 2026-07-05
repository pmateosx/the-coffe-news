import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { roomMembers } from "@/db/schema";
import { getRoomBySlug, getSessionMember } from "@/lib/room";
import { JoinForm } from "./join-form";

export const metadata = { title: "Unirse a la redacción — The Coffee News" };

export default async function JoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { slug } = await params;
  const { invite } = await searchParams;

  const room = await getRoomBySlug(slug);
  if (!room) notFound();

  const member = await getSessionMember(room.id);
  if (member) redirect(`/${room.slug}`);

  const validInvite = invite === room.inviteCode;
  const memberCount = await db.$count(roomMembers, eq(roomMembers.roomId, room.id));
  const full = memberCount >= room.memberSoftLimit;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-faded">The Coffee News</p>
      <h1 className="mt-2 font-serif text-4xl font-black">{room.name}</h1>
      {room.subtitle && <p className="mt-1 italic text-faded">{room.subtitle}</p>}
      <div className="double-rule my-6" />

      {!validInvite ? (
        <div className="space-y-4">
          <p className="border border-accent bg-accent/10 px-3 py-2 text-sm text-accent">
            Este link de invitación no es válido o ha cambiado. Pide a alguien de la
            redacción que te pase el link actual.
          </p>
          <p className="text-sm text-faded">
            ¿Ya eras miembro?{" "}
            <Link href={`/entrar?room=${room.slug}`} className="underline hover:text-ink">
              Entra con tu código secreto
            </Link>
            .
          </p>
        </div>
      ) : full ? (
        <p className="border border-accent bg-accent/10 px-3 py-2 text-sm text-accent">
          Esta redacción está completa ({room.memberSoftLimit} miembros). Habla con quien
          la creó.
        </p>
      ) : (
        <>
          <p className="mb-6 text-faded">
            Te han invitado a esta redacción. Elige tu identidad anónima para empezar a
            publicar.
          </p>
          <JoinForm slug={room.slug} invite={invite ?? ""} />
        </>
      )}
    </main>
  );
}
