import Image from "next/image";
import type { Article, RoomMember, Stamp } from "@/db/schema";
import { TransitionLink } from "@/components/view-transitions";
import { STAMP_UI, SECTION_LABELS } from "@/lib/labels";
import { plainExcerpt } from "@/lib/markdown";

export type ArticleWithRelations = Article & {
  author: RoomMember;
  stamps: Stamp[];
};

function StampCounts({ stamps }: { stamps: Stamp[] }) {
  const counts = new Map<string, number>();
  for (const stamp of stamps) {
    counts.set(stamp.stampType, (counts.get(stamp.stampType) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return (
    <span className="flex gap-2">
      {[...counts.entries()].map(([type, count]) => (
        <span key={type} className="text-xs text-faded">
          {STAMP_UI[type as keyof typeof STAMP_UI].emoji} {count}
        </span>
      ))}
    </span>
  );
}

export function ArticleCard({
  slug,
  article,
  className = "",
}: {
  slug: string;
  article: ArticleWithRelations;
  className?: string;
}) {
  const destacado = article.sizeHint === "destacado";
  const mini = article.sizeHint === "mini";

  return (
    <TransitionLink
      href={`/${slug}/articulo/${article.id}`}
      className={`group flex h-full flex-col border-b border-rule pb-4 ${className}`}
    >
      {article.coverImageUrl && !mini && (
        <div
          className={`relative w-full overflow-hidden bg-paper-dark ${
            destacado ? "aspect-[16/9]" : "aspect-[3/2]"
          }`}
          style={{ viewTransitionName: `article-image-${article.id}` }}
        >
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes={destacado ? "(max-width: 768px) 100vw, 640px" : "(max-width: 768px) 100vw, 320px"}
          />
        </div>
      )}

      <p className="mt-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-accent">
        {SECTION_LABELS[article.section]}
      </p>

      <h2
        className={`mt-1 font-serif font-black leading-tight group-hover:underline ${
          destacado ? "text-3xl sm:text-4xl" : mini ? "text-lg" : "text-2xl"
        }`}
        style={{ viewTransitionName: `article-title-${article.id}` }}
      >
        {article.title}
      </h2>

      {article.dek && !mini && (
        <p className="mt-2 font-serif italic text-faded">{article.dek}</p>
      )}

      {!mini && (
        <p className="mt-2 text-sm leading-relaxed text-faded">
          {plainExcerpt(article.body, destacado ? 260 : 140)}
        </p>
      )}

      <p className="mt-auto flex items-center justify-between pt-3 text-xs text-faded">
        <span>
          {article.author.emoji} {article.author.displayName}
        </span>
        <StampCounts stamps={article.stamps} />
      </p>
    </TransitionLink>
  );
}
