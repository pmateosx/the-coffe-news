"use client";

import { useTransition } from "react";
import { kickMember } from "@/actions/members";

export function KickButton({
  slug,
  memberId,
  displayName,
}: {
  slug: string;
  memberId: string;
  displayName: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            `¿Expulsar a ${displayName}? Se borrarán también sus artículos y sellos. No hay vuelta atrás.`,
          )
        ) {
          startTransition(() => kickMember(slug, memberId));
        }
      }}
      className="text-xs text-accent underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending ? "expulsando…" : "expulsar"}
    </button>
  );
}
