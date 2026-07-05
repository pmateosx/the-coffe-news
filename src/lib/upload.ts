import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

const MAX_SIZE = 4 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Sube la imagen de portada a Vercel Blob. En desarrollo, sin
 * BLOB_READ_WRITE_TOKEN, cae a public/uploads para no bloquear el flujo.
 */
export async function uploadCoverImage(file: File, roomId: string): Promise<UploadResult> {
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "La imagen no puede superar los 4 MB." };
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return { ok: false, error: "Formato de imagen no soportado (usa JPG, PNG, WebP, GIF o AVIF)." };
  }

  const filename = `${nanoid(16)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`covers/${roomId}/${filename}`, file, { access: "public" });
    return { ok: true, url: blob.url };
  }

  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "Almacenamiento de imágenes no configurado (BLOB_READ_WRITE_TOKEN)." };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { ok: true, url: `/uploads/${filename}` };
}
