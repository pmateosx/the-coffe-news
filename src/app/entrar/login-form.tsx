"use client";

import { useActionState } from "react";
import { loginWithCode, type LoginState } from "@/actions/members";

const inputClass =
  "w-full border border-rule bg-white px-3 py-2 text-ink placeholder:text-faded/60 focus:border-ink focus:outline-none";

export function LoginForm({ initialSlug }: { initialSlug?: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginWithCode,
    { status: "idle" },
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold">Periódico</span>
        <input
          name="slug"
          required
          defaultValue={initialSlug}
          placeholder="la-gaceta-de-la-tercera-planta"
          className={`mt-1 ${inputClass}`}
        />
        <span className="mt-1 block text-xs text-faded">
          Es la parte final de la URL de tu periódico.
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Código secreto</span>
        <input
          name="code"
          required
          placeholder="lince-cobre-482"
          autoComplete="off"
          className={`mt-1 font-mono ${inputClass}`}
        />
      </label>

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
        {pending ? "Comprobando credencial…" : "Volver a la redacción"}
      </button>
    </form>
  );
}
