"use client";

import { useTransition } from "react";
import { deleteArticle } from "@/actions/articles";

export function DeleteArticleButton({
  slug,
  articleId,
}: {
  slug: string;
  articleId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("¿Retirar este artículo de la edición? No hay papelera.")) {
          startTransition(() => deleteArticle(slug, articleId));
        }
      }}
      className="border border-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent hover:bg-accent hover:text-paper disabled:opacity-50"
    >
      {pending ? "Retirando…" : "Retirar artículo"}
    </button>
  );
}
