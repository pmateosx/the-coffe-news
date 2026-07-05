"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { roomMembers, rooms } from "@/db/schema";
import { setRoomSession } from "@/lib/auth";
import { EMOJIS } from "@/lib/emojis";
import { getRoomBySlug, getSessionMember } from "@/lib/room";
import { generateSecretCode, hashSecretCode } from "@/lib/secret-code";
import { uniqueRoomSlug } from "@/lib/slug";

export type CreateRoomState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "success";
      slug: string;
      secretCode: string;
      invitePath: string;
    };

export async function createRoom(
  _prev: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const name = String(formData.get("name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "");

  if (name.length < 2 || name.length > 60) {
    return { status: "error", message: "El nombre del periódico debe tener entre 2 y 60 caracteres." };
  }
  if (subtitle.length > 120) {
    return { status: "error", message: "El subtítulo no puede superar los 120 caracteres." };
  }
  if (displayName.length < 2 || displayName.length > 24) {
    return { status: "error", message: "Tu nombre debe tener entre 2 y 24 caracteres." };
  }
  if (!EMOJIS.includes(emoji)) {
    return { status: "error", message: "Elige un emoji de la lista." };
  }

  const slug = await uniqueRoomSlug(name);
  const secretCode = generateSecretCode();
  const secretCodeHash = await hashSecretCode(secretCode);

  const [room] = await db
    .insert(rooms)
    .values({ slug, name, subtitle })
    .returning();

  const [founder] = await db
    .insert(roomMembers)
    .values({
      roomId: room.id,
      displayName,
      emoji,
      role: "admin",
      secretCodeHash,
    })
    .returning();

  await setRoomSession(room.id, founder.id);

  return {
    status: "success",
    slug: room.slug,
    secretCode,
    invitePath: `/${room.slug}/join?invite=${room.inviteCode}`,
  };
}

export type UpdateSubtitleState = { status: "idle" | "success" } | { status: "error"; message: string };

export async function updateSubtitle(
  _prev: UpdateSubtitleState,
  formData: FormData,
): Promise<UpdateSubtitleState> {
  const slug = String(formData.get("slug") ?? "");
  const subtitle = String(formData.get("subtitle") ?? "").trim();

  if (subtitle.length > 120) {
    return { status: "error", message: "El subtítulo no puede superar los 120 caracteres." };
  }

  const room = await getRoomBySlug(slug);
  if (!room) return { status: "error", message: "Periódico no encontrado." };

  const member = await getSessionMember(room.id);
  if (!member) return { status: "error", message: "No eres miembro de este periódico." };

  await db.update(rooms).set({ subtitle }).where(eq(rooms.id, room.id));
  revalidatePath(`/${room.slug}`);
  return { status: "success" };
}
