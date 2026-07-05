import type { Section, SizeHint, StampType } from "@/db/schema";

export const SECTION_LABELS: Record<Section, string> = {
  noticia: "Noticia",
  columna: "Columna de opinión",
  carta_al_director: "Carta al director",
  clasificado: "Clasificado",
  clima_oficina: "Clima de oficina",
};

export const SIZE_HINT_LABELS: Record<SizeHint, { label: string; help: string }> = {
  normal: { label: "Normal", help: "Una card estándar en portada" },
  destacado: { label: "Destacado", help: "Ocupa más espacio: para bombazos" },
  mini: { label: "Breve", help: "Card pequeña, tipo teletipo" },
};

export const STAMP_UI: Record<StampType, { emoji: string; label: string }> = {
  breaking: { emoji: "🚨", label: "Breaking" },
  rumor: { emoji: "🤫", label: "Rumor" },
  gracioso: { emoji: "😂", label: "Gracioso" },
  importante: { emoji: "📌", label: "Importante" },
};
