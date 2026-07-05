"use client";

import Link from "next/link";
import { useState } from "react";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="rounded border border-ink px-3 py-1 text-xs font-medium uppercase tracking-wide hover:bg-paper-dark"
    >
      {copied ? "¡Copiado!" : label}
    </button>
  );
}

export function CodeReveal({
  slug,
  secretCode,
  invitePath,
  isFounder,
}: {
  slug: string;
  secretCode: string;
  invitePath?: string;
  isFounder?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="border-2 border-ink bg-paper-dark p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Tu código secreto — se muestra una sola vez
        </p>
        <p className="mt-3 font-serif text-4xl font-bold tracking-wide">{secretCode}</p>
        <div className="mt-4 flex justify-center">
          <CopyButton text={secretCode} label="Copiar código" />
        </div>
        <p className="mt-4 text-sm text-faded">
          Apúntalo en un lugar seguro: es tu única forma de volver a entrar desde otro
          dispositivo o si se borra la sesión. No podremos recuperarlo.
        </p>
      </div>

      {invitePath && (
        <div className="border border-rule p-4">
          <p className="text-sm font-semibold">
            {isFounder ? "Invita a tu redacción" : "Link de invitación"}
          </p>
          <p className="mt-1 break-all text-sm text-faded">{invitePath}</p>
          <div className="mt-2">
            <CopyButton
              text={
                typeof window === "undefined"
                  ? invitePath
                  : `${window.location.origin}${invitePath}`
              }
              label="Copiar link de invitación"
            />
          </div>
        </div>
      )}

      <Link
        href={`/${slug}`}
        className="block bg-ink px-4 py-3 text-center font-semibold text-paper hover:bg-accent"
      >
        Abrir tu periódico →
      </Link>
    </div>
  );
}
