"use client";

import { useActionState } from "react";
import { createRoom, type CreateRoomState } from "@/actions/rooms";
import { CodeReveal } from "@/components/code-reveal";
import { EmojiPicker } from "@/components/emoji-picker";

const inputClass =
  "w-full border border-rule bg-white px-3 py-2 text-ink placeholder:text-faded/60 focus:border-ink focus:outline-none";

export function NewRoomForm() {
  const [state, formAction, pending] = useActionState<CreateRoomState, FormData>(
    createRoom,
    { status: "idle" },
  );

  if (state.status === "success") {
    return (
      <CodeReveal
        slug={state.slug}
        secretCode={state.secretCode}
        invitePath={state.invitePath}
        isFounder
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Nombre del periódico</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            placeholder="La Gaceta de la Tercera Planta"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">
            Subtítulo <span className="font-normal text-faded">(opcional, editable luego)</span>
          </span>
          <input
            name="subtitle"
            maxLength={120}
            placeholder="Todo lo que se cuece mientras se enfría el café"
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>

      <div className="border-t border-rule pt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Tu identidad de redactor
        </p>
        <label className="mt-3 block">
          <span className="text-sm font-semibold">Nombre visible</span>
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={24}
            placeholder="Garganta Profunda"
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <div className="mt-3">
          <span className="text-sm font-semibold">Tu emoji</span>
          <div className="mt-2">
            <EmojiPicker />
          </div>
        </div>
      </div>

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
        {pending ? "Imprimiendo cabecera…" : "Fundar periódico"}
      </button>
    </form>
  );
}
