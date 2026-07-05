// Markdown mínimo del MVP: **negrita**, *cursiva* y párrafos (línea en blanco).
// Se escapa el HTML antes de transformar: el body nunca inyecta etiquetas propias.

function escapeHtml(src: string): string {
  return src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderBasicMarkdown(src: string): string {
  const inline = escapeHtml(src)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  return inline
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/** Texto plano para las cards de portada. */
export function plainExcerpt(src: string, maxLength = 180): string {
  const plain = src.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*\n]+)\*/g, "$1").replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).replace(/\s+\S*$/, "")}…`;
}
