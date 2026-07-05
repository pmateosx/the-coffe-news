import { notFound } from "next/navigation";
import { getRoomBySlug } from "@/lib/room";

export default async function RoomLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room) notFound();
  return <>{children}</>;
}
