"use client";

import { useActionState } from "react";
import {
  createArticle,
  updateArticle,
  type ArticleFormState,
} from "@/actions/articles";
import type { Article } from "@/db/schema";
import { SECTIONS, SIZE_HINTS } from "@/db/schema";
import { SECTION_LABELS, SIZE_HINT_LABELS } from "@/lib/labels";

const inputClass =
  "w-full border border-rule bg-white px-3 py-2 text-ink placeholder:text-faded/60 focus:border-ink focus:outline-none";

export function ArticleForm({ slug, article }: { slug: string; article?: Article }) {
  const action = article ? updateArticle : createArticle;
  const [state, formAction, pending] = useActionState<ArticleFormState, FormData>(
    action,
    { status: "idle" },
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      {article && <input type="hidden" name="articleId" value={article.id} />}

      <label className="block">
        <span className="text-sm font-semibold">Sección</span>
        <select
          name="section"
          required
          defaultValue={article?.section ?? "noticia"}
          className={`mt-1 ${inputClass}`}
        >
          {SECTIONS.map((section) => (
            <option key={section} value={section}>
              {SECTION_LABELS[section]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Titular</span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={120}
          defaultValue={article?.title}
          placeholder="La impresora de la 3ª vuelve a funcionar (nadie sabe por qué)"
          className={`mt-1 font-serif text-lg ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">
          Entradilla <span className="font-normal text-faded">(opcional)</span>
        </span>
        <input
          name="dek"
          maxLength={200}
          defaultValue={article?.dek ?? ""}
          placeholder="Un resumen en una línea para la portada"
          className={`mt-1 ${inputClass}`}
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold">Cuerpo</span>
        <textarea
          name="body"
          required
          rows={10}
          maxLength={10000}
          defaultValue={article?.body}
          placeholder="Escribe aquí. **negrita**, *cursiva* y párrafos separados por una línea en blanco."
          className={`mt-1 ${inputClass}`}
        />
        <span className="mt-1 block text-xs text-faded">
          Markdown básico: **negrita**, *cursiva*, línea en blanco = nuevo párrafo.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-semibold">
          Imagen de portada{" "}
          <span className="font-normal text-faded">
            (opcional{article?.coverImageUrl ? ", sustituye a la actual" : ""}, máx. 4 MB)
          </span>
        </span>
        <input
          type="file"
          name="coverImage"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="mt-1 block w-full text-sm text-faded file:mr-3 file:border file:border-ink file:bg-paper file:px-3 file:py-1 file:text-xs file:font-semibold file:uppercase file:text-ink"
        />
      </label>

      <fieldset>
        <legend className="text-sm font-semibold">Tamaño en portada</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {SIZE_HINTS.map((hint) => (
            <label
              key={hint}
              className="flex cursor-pointer flex-col border border-rule p-3 has-checked:border-ink has-checked:bg-paper-dark"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sizeHint"
                  value={hint}
                  defaultChecked={(article?.sizeHint ?? "normal") === hint}
                  className="accent-ink"
                />
                <span className="text-sm font-semibold">{SIZE_HINT_LABELS[hint].label}</span>
              </span>
              <span className="mt-1 text-xs text-faded">{SIZE_HINT_LABELS[hint].help}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.status === "error" && (
        <p className="border border-accent bg-accent/10 px-3 py-2 text-sm text-accent">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-ink px-4 py-3 font-semibold text-paper hover:bg-accent disabled:opacity-50"
      >
        {pending
          ? "Enviando a imprenta…"
          : article
            ? "Guardar cambios"
            : "Publicar en la edición actual"}
      </button>
    </form>
  );
}
