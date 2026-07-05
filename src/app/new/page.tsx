import Link from "next/link";
import { NewRoomForm } from "./new-room-form";

export const metadata = { title: "Fundar un periódico — The Coffee News" };

export default function NewRoomPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <Link href="/" className="text-sm text-faded hover:text-ink">
        ← The Coffee News
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-black">Fundar un periódico</h1>
      <p className="mt-2 text-faded">
        Crea la redacción de tu oficina. Tú serás su editor y podrás invitar al resto con
        un link.
      </p>
      <div className="double-rule my-6" />
      <NewRoomForm />
    </main>
  );
}
