import Link from "next/link";
import type { Room, RoomMember } from "@/db/schema";
import { InviteCopyButton } from "@/components/invite-copy-button";
import { LogoutButton } from "@/components/logout-button";
import { SubtitleEditor } from "@/components/subtitle-editor";
import { formatLongDate } from "@/lib/dates";

export function Masthead({
  room,
  member,
  memberCount,
}: {
  room: Room;
  member: RoomMember;
  memberCount: number;
}) {
  return (
    <header className="text-center">
      <div className="flex items-baseline justify-between border-b border-rule pb-1 text-[0.65rem] uppercase tracking-widest text-faded">
        <span>Precio: un café solo</span>
        <span className="font-bold">The Coffee News</span>
        <span>Caduca en 7 días</span>
      </div>

      <h1 className="mt-6 font-serif text-5xl font-black tracking-tight sm:text-7xl">
        {room.name}
      </h1>
      <SubtitleEditor slug={room.slug} subtitle={room.subtitle} />
      <p className="mt-3 text-xs uppercase tracking-widest text-faded">
        Edición Nº{room.editionNumber} — desde el {formatLongDate(room.editionStartedAt)} ·{" "}
        {memberCount} {memberCount === 1 ? "redactor" : "redactores"}
      </p>
      <div className="double-rule mt-4" />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-faded">
          {member.emoji} {member.displayName}
          {member.role === "admin" ? " · editor" : ""} · <LogoutButton slug={room.slug} />
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/${room.slug}/archivo`}
            className="px-2 py-2 text-sm font-semibold text-faded hover:text-ink"
          >
            Hemeroteca
          </Link>
          <InviteCopyButton invitePath={`/${room.slug}/join?invite=${room.inviteCode}`} />
          <Link
            href={`/${room.slug}/escribir`}
            className="bg-ink px-4 py-2 font-semibold text-paper hover:bg-accent"
          >
            ✎ Escribir noticia
          </Link>
        </div>
      </div>
    </header>
  );
}
