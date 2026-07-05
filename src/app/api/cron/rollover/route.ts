import { NextResponse } from "next/server";
import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { articles, rooms } from "@/db/schema";

const EDITION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Chequeo diario (Vercel Cron): toda room cuya edición haya cumplido 7 días
 * archiva sus artículos activos y estrena edición. No se borra nada.
 */
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - EDITION_LIFETIME_MS);
  const due = await db.query.rooms.findMany({
    where: lte(rooms.editionStartedAt, cutoff),
    columns: { id: true, slug: true, editionNumber: true },
  });

  const rotated: Array<{ slug: string; closedEdition: number }> = [];
  for (const room of due) {
    await db
      .update(articles)
      .set({ archived: true })
      .where(and(eq(articles.roomId, room.id), eq(articles.archived, false)));
    await db
      .update(rooms)
      .set({ editionNumber: room.editionNumber + 1, editionStartedAt: new Date() })
      .where(eq(rooms.id, room.id));
    rotated.push({ slug: room.slug, closedEdition: room.editionNumber });
  }

  return NextResponse.json({ checked: due.length, rotated });
}
