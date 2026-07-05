"use client";

import { useActionState } from "react";
import { joinRoom, type JoinRoomState } from "@/actions/members";
import { CodeReveal } from "@/components/code-reveal";
import { EmojiPicker } from "@/components/emoji-picker";

const inputClass =
  "w-full border border-rule bg-white px-3 py-2 text-ink placeholder:text-faded/60 focus:border-ink focus:outline-none";

export function JoinForm({ slug, invite }: { slug: string; invite: string }) {
  const [state, formAction, pending] = useActionState<JoinRoomState, FormData>(
    joinRoom,
    { status: "idle" },
  );

  if (state.status === "success") {
    return <CodeReveal slug={state.slug} secretCode={state.secretCode} />;
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="invite" value={invite} />

      <label className="block">
        <span className="text-sm font-semibold">Nombre visible</span>
        <input
          name="displayName"
          required
          minLength={2}
          maxLength={24}
          placeholder="Becario Infiltrado"
          className={`mt-1 ${inputClass}`}
        />
        <span className="mt-1 block text-xs text-faded">
          Anónimo de verdad: nadie sabrá quién eres salvo que tú lo cuentes.
        </span>
      </label>

      <div>
        <span className="text-sm font-semibold">Tu emoji</span>
        <div className="mt-2">
          <EmojiPicker />
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
        {pending ? "Firmando contrato…" : "Unirme a la redacción"}
      </button>
    </form>
  );
}
