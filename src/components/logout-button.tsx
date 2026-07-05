"use client";

import { useTransition } from "react";
import { logout } from "@/actions/members";

export function LogoutButton({ slug }: { slug: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "¿Cerrar sesión en este dispositivo? Necesitarás tu código secreto para volver.",
          )
        ) {
          startTransition(() => logout(slug));
        }
      }}
      className="text-xs text-faded underline-offset-2 hover:text-ink hover:underline"
    >
      salir
    </button>
  );
}
