import "server-only";
import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { roomMembers, rooms, type Room, type RoomMember } from "@/db/schema";
import { readSession } from "@/lib/auth";

export const getRoomBySlug = cache(async (slug: string): Promise<Room | undefined> => {
  return db.query.rooms.findFirst({ where: eq(rooms.slug, slug) });
});

/** Member de la sesión actual en esta room, o null si no pertenece a ella. */
export const getSessionMember = cache(
  async (roomId: string): Promise<RoomMember | null> => {
    const session = await readSession();
    const memberId = session.rooms[roomId];
    if (!memberId) return null;
    const member = await db.query.roomMembers.findFirst({
      where: and(eq(roomMembers.id, memberId), eq(roomMembers.roomId, roomId)),
    });
    if (!member) return null;
    // last_seen_at con granularidad de una hora para no escribir en cada request
    if (Date.now() - member.lastSeenAt.getTime() > 60 * 60 * 1000) {
      await db
        .update(roomMembers)
        .set({ lastSeenAt: new Date() })
        .where(eq(roomMembers.id, member.id));
    }
    return member;
  },
);
