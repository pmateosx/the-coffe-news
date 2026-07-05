import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rooms } from "@/db/schema";

// Rutas de primer nivel que no pueden ser slugs de room.
const RESERVED = new Set(["new", "entrar", "api", "_next", "favicon.ico"]);

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function uniqueRoomSlug(name: string): Promise<string> {
  const base = slugify(name) || "periodico";
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    if (RESERVED.has(candidate)) continue;
    const existing = await db.query.rooms.findFirst({
      where: eq(rooms.slug, candidate),
      columns: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
