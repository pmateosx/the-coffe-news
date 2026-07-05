"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  articles,
  SECTIONS,
  SIZE_HINTS,
  stamps,
  type Article,
  type Room,
  type RoomMember,
  type Section,
  type SizeHint,
} from "@/db/schema";
import { getRoomBySlug, getSessionMember } from "@/lib/room";
import { uploadCoverImage } from "@/lib/upload";

export type ArticleFormState = { status: "idle" } | { status: "error"; message: string };

type ParsedFields = {
  section: Section;
  title: string;
  dek: string | null;
  body: string;
  sizeHint: SizeHint;
};

function parseFields(formData: FormData): ParsedFields | { error: string } {
  const section = String(formData.get("section") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dek = String(formData.get("dek") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const sizeHint = String(formData.get("sizeHint") ?? "normal");

  if (!(SECTIONS as readonly string[]).includes(section)) {
    return { error: "Elige una sección válida." };
  }
  if (title.length < 2 || title.length > 120) {
    return { error: "El titular debe tener entre 2 y 120 caracteres." };
  }
  if (dek.length > 200) {
    return { error: "La entradilla no puede superar los 200 caracteres." };
  }
  if (body.length < 1 || body.length > 10_000) {
    return { error: "El cuerpo no puede estar vacío ni superar los 10.000 caracteres." };
  }
  if (!(SIZE_HINTS as readonly string[]).includes(sizeHint)) {
    return { error: "Elige un tamaño válido." };
  }

  return {
    section: section as Section,
    title,
    dek: dek || null,
    body,
    sizeHint: sizeHint as SizeHint,
  };
}

async function requireRoomAndMember(
  slug: string,
): Promise<{ room: Room; member: RoomMember } | { error: string }> {
  const room = await getRoomBySlug(slug);
  if (!room) return { error: "Periódico no encontrado." };
  const member = await getSessionMember(room.id);
  if (!member) return { error: "Tu sesión ha caducado: vuelve a entrar con tu código." };
  return { room, member };
}

function isEditable(article: Article, room: Room): boolean {
  return !article.archived && article.editionNumber === room.editionNumber;
}

export async function createArticle(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const slug = String(formData.get("slug") ?? "");
  const ctx = await requireRoomAndMember(slug);
  if ("error" in ctx) return { status: "error", message: ctx.error };

  const fields = parseFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };

  let coverImageUrl: string | null = null;
  const cover = formData.get("coverImage");
  if (cover instanceof File && cover.size > 0) {
    const uploaded = await uploadCoverImage(cover, ctx.room.id);
    if (!uploaded.ok) return { status: "error", message: uploaded.error };
    coverImageUrl = uploaded.url;
  }

  await db.insert(articles).values({
    roomId: ctx.room.id,
    authorMemberId: ctx.member.id,
    editionNumber: ctx.room.editionNumber,
    ...fields,
    coverImageUrl,
  });

  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}

export async function updateArticle(
  _prev: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const slug = String(formData.get("slug") ?? "");
  const articleId = String(formData.get("articleId") ?? "");
  const ctx = await requireRoomAndMember(slug);
  if ("error" in ctx) return { status: "error", message: ctx.error };

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.roomId, ctx.room.id)),
  });
  if (!article) return { status: "error", message: "Artículo no encontrado." };
  if (article.authorMemberId !== ctx.member.id) {
    return { status: "error", message: "Solo su autor puede editar este artículo." };
  }
  if (!isEditable(article, ctx.room)) {
    return { status: "error", message: "Esta edición ya está archivada: no se puede editar." };
  }

  const fields = parseFields(formData);
  if ("error" in fields) return { status: "error", message: fields.error };

  let coverImageUrl = article.coverImageUrl;
  const cover = formData.get("coverImage");
  if (cover instanceof File && cover.size > 0) {
    const uploaded = await uploadCoverImage(cover, ctx.room.id);
    if (!uploaded.ok) return { status: "error", message: uploaded.error };
    coverImageUrl = uploaded.url;
  }

  await db
    .update(articles)
    .set({ ...fields, coverImageUrl })
    .where(eq(articles.id, article.id));

  revalidatePath(`/${slug}`);
  revalidatePath(`/${slug}/articulo/${article.id}`);
  redirect(`/${slug}/articulo/${article.id}`);
}

/** El autor puede borrar su artículo mientras la edición esté activa; el admin, siempre. */
export async function deleteArticle(slug: string, articleId: string): Promise<void> {
  const ctx = await requireRoomAndMember(slug);
  if ("error" in ctx) throw new Error(ctx.error);

  const article = await db.query.articles.findFirst({
    where: and(eq(articles.id, articleId), eq(articles.roomId, ctx.room.id)),
  });
  if (!article) throw new Error("Artículo no encontrado.");

  const isAdmin = ctx.member.role === "admin";
  const isAuthor = article.authorMemberId === ctx.member.id;
  if (!isAdmin && !(isAuthor && isEditable(article, ctx.room))) {
    throw new Error("No puedes borrar este artículo.");
  }

  // Borrado explícito de sellos: el pragma de FKs puede no estar activo en libSQL.
  await db.delete(stamps).where(eq(stamps.articleId, article.id));
  await db.delete(articles).where(eq(articles.id, article.id));

  revalidatePath(`/${slug}`);
  redirect(`/${slug}`);
}
