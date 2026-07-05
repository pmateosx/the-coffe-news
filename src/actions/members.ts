"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { articles, roomMembers, stamps } from "@/db/schema";
import { clearRoomSession, setRoomSession } from "@/lib/auth";
import { EMOJIS } from "@/lib/emojis";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRoomBySlug, getSessionMember } from "@/lib/room";
import { generateSecretCode, hashSecretCode, verifySecretCode } from "@/lib/secret-code";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export type JoinRoomState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; slug: string; secretCode: string };

export async function joinRoom(
  _prev: JoinRoomState,
  formData: FormData,
): Promise<JoinRoomState> {
  const slug = String(formData.get("slug") ?? "");
  const invite = String(formData.get("invite") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "");

  const room = await getRoomBySlug(slug);
  if (!room || room.inviteCode !== invite) {
    return { status: "error", message: "El link de invitación no es válido." };
  }
  if (displayName.length < 2 || displayName.length > 24) {
    return { status: "error", message: "Tu nombre debe tener entre 2 y 24 caracteres." };
  }
  if (!EMOJIS.includes(emoji)) {
    return { status: "error", message: "Elige un emoji de la lista." };
  }

  const current = await db.$count(roomMembers, eq(roomMembers.roomId, room.id));
  if (current >= room.memberSoftLimit) {
    return {
      status: "error",
      message: "Este periódico ha alcanzado su límite de redactores.",
    };
  }

  const taken = await db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.roomId, room.id), eq(roomMembers.displayName, displayName)),
    columns: { id: true },
  });
  if (taken) {
    return { status: "error", message: "Ya hay alguien con ese nombre en la redacción. Elige otro." };
  }

  const secretCode = generateSecretCode();
  const [member] = await db
    .insert(roomMembers)
    .values({
      roomId: room.id,
      displayName,
      emoji,
      secretCodeHash: await hashSecretCode(secretCode),
    })
    .returning();

  await setRoomSession(room.id, member.id);

  return { status: "success", slug: room.slug, secretCode };
}

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function loginWithCode(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "");

  if (!slug || !code.trim()) {
    return { status: "error", message: "Indica el periódico y tu código secreto." };
  }

  const ip = await clientIp();
  if (!checkRateLimit(`login:${ip}:${slug}`, 5, 15 * 60 * 1000)) {
    return {
      status: "error",
      message: "Demasiados intentos. Espera unos minutos y vuelve a probarlo.",
    };
  }

  const room = await getRoomBySlug(slug);
  if (!room) {
    return { status: "error", message: "No existe ningún periódico con ese nombre." };
  }

  const members = await db.query.roomMembers.findMany({
    where: eq(roomMembers.roomId, room.id),
    columns: { id: true, secretCodeHash: true },
  });

  let matchedId: string | null = null;
  for (const candidate of members) {
    if (await verifySecretCode(code, candidate.secretCodeHash)) {
      matchedId = candidate.id;
      break;
    }
  }

  if (!matchedId) {
    return { status: "error", message: "Ese código no corresponde a nadie de esta redacción." };
  }

  await db
    .update(roomMembers)
    .set({ lastSeenAt: new Date() })
    .where(eq(roomMembers.id, matchedId));
  await setRoomSession(room.id, matchedId);

  redirect(`/${room.slug}`);
}

/** Solo el admin. Borra al miembro y todo su contenido (identidades anónimas: sin papelera). */
export async function kickMember(slug: string, memberId: string): Promise<void> {
  const room = await getRoomBySlug(slug);
  if (!room) throw new Error("Periódico no encontrado");

  const actor = await getSessionMember(room.id);
  if (!actor || actor.role !== "admin") throw new Error("Solo el editor puede expulsar");
  if (actor.id === memberId) throw new Error("No puedes expulsarte a ti mismo");

  const target = await db.query.roomMembers.findFirst({
    where: and(eq(roomMembers.id, memberId), eq(roomMembers.roomId, room.id)),
    columns: { id: true },
  });
  if (!target) throw new Error("Miembro no encontrado");

  // Borrado explícito en orden (el pragma de FKs puede no estar activo en libSQL).
  const authored = await db
    .select({ id: articles.id })
    .from(articles)
    .where(eq(articles.authorMemberId, memberId));
  const articleIds = authored.map((a) => a.id);

  if (articleIds.length > 0) {
    await db.delete(stamps).where(inArray(stamps.articleId, articleIds));
    await db.delete(articles).where(inArray(articles.id, articleIds));
  }
  await db.delete(stamps).where(eq(stamps.memberId, memberId));
  await db.delete(roomMembers).where(eq(roomMembers.id, memberId));

  revalidatePath(`/${room.slug}`);
}

export async function logout(slug: string): Promise<void> {
  const room = await getRoomBySlug(slug);
  if (room) await clearRoomSession(room.id);
  redirect("/");
}
