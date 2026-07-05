"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { articles, STAMP_TYPES, stamps, type StampType } from "@/db/schema";
import { getRoomBySlug, getSessionMember } from "@/lib/room";

/** Añade o quita (toggle) un sello del miembro actual sobre un artículo. */
export async function toggleStamp(
  slug: string,
  articleId: string,
  stampType: StampType,
): Promise<void> {
  if (!(STAMP_TYPES as readonly string[]).includes(stampType)) return;

  const room = await getRoomBySlug(slug);
  if (!room) return;
  const member = await getSessionMember(room.id);
  if (!member) return;

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.roomId, room.id)),
    columns: { id: true, archived: true },
  });
  // La hemeroteca es de solo lectura: sin sellos sobre artículos archivados.
  if (!article || article.archived) return;

  const existing = await db.query.stamps.findFirst({
    where: and(
      eq(stamps.articleId, article.id),
      eq(stamps.memberId, member.id),
      eq(stamps.stampType, stampType),
    ),
    columns: { id: true },
  });

  if (existing) {
    await db.delete(stamps).where(eq(stamps.id, existing.id));
  } else {
    try {
      await db.insert(stamps).values({
        articleId: article.id,
        memberId: member.id,
        stampType,
      });
    } catch {
      // doble click / carrera contra el índice único: el sello ya existe
    }
  }

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/articulo/${article.id}`);
}
