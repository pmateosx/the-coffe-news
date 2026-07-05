import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-faded">
        Fundado en la máquina de café
      </p>
      <h1 className="mt-4 font-serif text-6xl font-black tracking-tight sm:text-7xl">
        The Coffee News
      </h1>
      <div className="double-rule mt-6 w-full" />
      <p className="mt-6 max-w-md text-lg text-faded">
        El periódico efímero de tu oficina. Noticias anónimas, sellos de la redacción y
        ediciones que caducan cada 7 días.
      </p>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/new"
          className="bg-ink px-4 py-3 font-semibold text-paper hover:bg-accent"
        >
          Fundar un periódico
        </Link>
        <Link
          href="/entrar"
          className="border border-ink px-4 py-3 font-semibold hover:bg-paper-dark"
        >
          Ya tengo un código secreto
        </Link>
      </div>

      <p className="mt-10 text-sm text-faded">
        Sin cuentas ni emails: eliges un nombre, un emoji y te llevas un código secreto.
      </p>
    </main>
  );
}
