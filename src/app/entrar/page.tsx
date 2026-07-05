import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata = { title: "Volver a entrar — The Coffee News" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-faded hover:text-ink">
        ← The Coffee News
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-black">Volver a entrar</h1>
      <p className="mt-2 text-faded">
        ¿Sesión perdida u otro dispositivo? Recupera tu identidad con el código secreto
        que apuntaste al unirte.
      </p>
      <div className="double-rule my-6" />
      <LoginForm initialSlug={room} />
      <p className="mt-6 text-sm text-faded">
        ¿Sin código? Pide a un compañero el link de invitación para unirte de nuevo.
      </p>
    </main>
  );
}
