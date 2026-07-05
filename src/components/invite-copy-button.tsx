"use client";

import { useState } from "react";

export function InviteCopyButton({ invitePath }: { invitePath: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="border border-ink px-3 py-2 text-sm font-semibold hover:bg-paper-dark"
    >
      {copied ? "¡Link copiado!" : "+ Invitar"}
    </button>
  );
}
