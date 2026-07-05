"use client";

import { useActionState, useState } from "react";
import { updateSubtitle, type UpdateSubtitleState } from "@/actions/rooms";

export function SubtitleEditor({ slug, subtitle }: { slug: string; subtitle: string }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateSubtitleState, FormData>(
    async (prev, formData) => {
      const result = await updateSubtitle(prev, formData);
      if (result.status === "success") setEditing(false);
      return result;
    },
    { status: "idle" },
  );

  if (!editing) {
    return (
      <p className="group mt-2 italic text-faded">
        {subtitle || <span className="opacity-60">Sin subtítulo aún</span>}{" "}
        <button
          type="button"
          onClick={() => setEditing(true)}
          title="Editar subtítulo (cualquier miembro puede)"
          className="not-italic align-middle text-xs opacity-40 transition-opacity hover:opacity-100 group-hover:opacity-70"
        >
          ✎
        </button>
      </p>
    );
  }

  return (
    <form action={formAction} className="mx-auto mt-2 flex max-w-md items-center gap-2">
      <input type="hidden" name="slug" value={slug} />
      <input
        name="subtitle"
        defaultValue={subtitle}
        maxLength={120}
        autoFocus
        placeholder="El lema de vuestra redacción"
        className="w-full border border-rule bg-white px-2 py-1 text-center italic text-ink focus:border-ink focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-3 py-1 text-xs font-semibold uppercase text-paper hover:bg-accent disabled:opacity-50"
      >
        {pending ? "…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs text-faded hover:text-ink"
      >
        Cancelar
      </button>
      {state.status === "error" && (
        <span className="text-xs text-accent">{state.message}</span>
      )}
    </form>
  );
}
