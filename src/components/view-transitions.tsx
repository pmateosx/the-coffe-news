"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  startTransition,
  useLayoutEffect,
  type ComponentProps,
  type MouseEvent,
} from "react";

// View Transitions API nativa sobre la navegación del App Router.
// El truco: startViewTransition recibe una promesa que resolvemos cuando
// el pathname nuevo ya se ha comprometido en el DOM (useLayoutEffect).
let pendingResolve: (() => void) | null = null;

type DocumentWithVT = Document & {
  startViewTransition?: (update: () => Promise<void>) => unknown;
};

/** Montar una vez en el layout raíz: resuelve la transición pendiente al cambiar de ruta. */
export function ViewTransitionResolver() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    pendingResolve?.();
    pendingResolve = null;
  }, [pathname]);
  return null;
}

export function TransitionLink({
  href,
  onClick,
  children,
  ...props
}: ComponentProps<typeof Link>) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    const doc = document as DocumentWithVT;
    // Sin soporte del navegador, Link navega normal (sin animación).
    if (!doc.startViewTransition) return;

    event.preventDefault();
    const url = typeof href === "string" ? href : (href.pathname ?? "/");
    doc.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          pendingResolve = resolve;
          startTransition(() => router.push(url));
        }),
    );
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
