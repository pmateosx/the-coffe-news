"use client";

import { useTransition } from "react";
import { toggleStamp } from "@/actions/stamps";
import { STAMP_TYPES, type StampType } from "@/db/schema";
import { STAMP_UI } from "@/lib/labels";

export type StampSummary = Record<StampType, { count: number; mine: boolean }>;

export function StampBar({
  slug,
  articleId,
  summary,
  readOnly = false,
}: {
  slug: string;
  articleId: string;
  summary: StampSummary;
  readOnly?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {STAMP_TYPES.map((type) => {
        const { count, mine } = summary[type];
        if (readOnly && count === 0) return null;
        const ui = STAMP_UI[type];
        return (
          <button
            key={type}
            type="button"
            disabled={readOnly || pending}
            onClick={() => startTransition(() => toggleStamp(slug, articleId, type))}
            title={ui.label}
            className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              mine
                ? "border-accent bg-accent/10 text-accent"
                : "border-rule text-faded hover:border-ink hover:text-ink"
            } ${readOnly ? "cursor-default" : ""}`}
          >
            <span className="text-sm">{ui.emoji}</span>
            <span>{ui.label}</span>
            {count > 0 && <span className="font-bold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
