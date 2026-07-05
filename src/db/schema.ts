import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";

export const SECTIONS = [
  "noticia",
  "columna",
  "carta_al_director",
  "clasificado",
  "clima_oficina",
] as const;
export type Section = (typeof SECTIONS)[number];

export const SIZE_HINTS = ["normal", "destacado", "mini"] as const;
export type SizeHint = (typeof SIZE_HINTS)[number];

export const STAMP_TYPES = ["breaking", "rumor", "gracioso", "importante"] as const;
export type StampType = (typeof STAMP_TYPES)[number];

export const rooms = sqliteTable(
  "rooms",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    inviteCode: text("invite_code").notNull().$defaultFn(() => nanoid(16)),
    editionNumber: integer("edition_number").notNull().default(1),
    editionStartedAt: integer("edition_started_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    plan: text("plan", { enum: ["free"] }).notNull().default("free"),
    memberSoftLimit: integer("member_soft_limit").notNull().default(50),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("rooms_slug_uq").on(t.slug),
    uniqueIndex("rooms_invite_code_uq").on(t.inviteCode),
  ],
);

export const roomMembers = sqliteTable(
  "room_members",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    emoji: text("emoji").notNull(),
    role: text("role", { enum: ["admin", "member"] }).notNull().default("member"),
    secretCodeHash: text("secret_code_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("members_room_idx").on(t.roomId),
    uniqueIndex("members_room_name_uq").on(t.roomId, t.displayName),
  ],
);

export const articles = sqliteTable(
  "articles",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    authorMemberId: text("author_member_id")
      .notNull()
      .references(() => roomMembers.id),
    editionNumber: integer("edition_number").notNull(),
    section: text("section", { enum: SECTIONS }).notNull(),
    title: text("title").notNull(),
    dek: text("dek"),
    body: text("body").notNull(),
    coverImageUrl: text("cover_image_url"),
    sizeHint: text("size_hint", { enum: SIZE_HINTS }).notNull().default("normal"),
    archived: integer("archived", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("articles_room_edition_idx").on(t.roomId, t.editionNumber, t.archived)],
);

export const stamps = sqliteTable(
  "stamps",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid(12)),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    memberId: text("member_id")
      .notNull()
      .references(() => roomMembers.id, { onDelete: "cascade" }),
    stampType: text("stamp_type", { enum: STAMP_TYPES }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("stamps_member_type_uq").on(t.articleId, t.memberId, t.stampType),
    index("stamps_article_idx").on(t.articleId),
  ],
);

export const roomsRelations = relations(rooms, ({ many }) => ({
  members: many(roomMembers),
  articles: many(articles),
}));

export const roomMembersRelations = relations(roomMembers, ({ one, many }) => ({
  room: one(rooms, { fields: [roomMembers.roomId], references: [rooms.id] }),
  articles: many(articles),
  stamps: many(stamps),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  room: one(rooms, { fields: [articles.roomId], references: [rooms.id] }),
  author: one(roomMembers, {
    fields: [articles.authorMemberId],
    references: [roomMembers.id],
  }),
  stamps: many(stamps),
}));

export const stampsRelations = relations(stamps, ({ one }) => ({
  article: one(articles, { fields: [stamps.articleId], references: [articles.id] }),
  member: one(roomMembers, { fields: [stamps.memberId], references: [roomMembers.id] }),
}));

export type Room = typeof rooms.$inferSelect;
export type RoomMember = typeof roomMembers.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Stamp = typeof stamps.$inferSelect;
