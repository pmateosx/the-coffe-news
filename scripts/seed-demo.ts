/**
 * Seed de demo: crea una room con redacción y una edición completa de artículos
 * (todas las secciones, varios tamaños, sellos y portadas). Idempotente: si ya
 * existe la room de demo la borra y la vuelve a crear.
 *
 *   npx tsx scripts/seed-demo.ts
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  rooms,
  roomMembers,
  articles,
  stamps,
  type Section,
  type SizeHint,
  type StampType,
} from "../src/db/schema";
import { hashSecretCode } from "../src/lib/secret-code";

const SLUG = "el-cafetero";
const ADMIN_CODE = "cafe-oro-777"; // código legible para entrar como editora

// ---------------------------------------------------------------------------
// Portadas: SVG editorial -> JPEG (sharp). Se versionan en public/demo/ para que
// viajen con el despliegue (Vercel); next/image las sirve en /demo/*.
// ---------------------------------------------------------------------------
const UPLOADS = path.join(process.cwd(), "public", "demo");

type CoverOpts = {
  w: number;
  h: number;
  from: string;
  to: string;
  kicker: string;
  headline: string;
};

function coverSvg({ w, h, from, to, kicker, headline }: CoverOpts): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${from}"/>
        <stop offset="1" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#g)"/>
    <circle cx="${w * 0.82}" cy="${h * 0.24}" r="${h * 0.32}" fill="#ffffff" opacity="0.08"/>
    <circle cx="${w * 0.18}" cy="${h * 0.86}" r="${h * 0.24}" fill="#000000" opacity="0.10"/>
    <rect x="${w * 0.08}" y="${h * 0.34}" width="${w * 0.12}" height="6" fill="#ffffff" opacity="0.85"/>
    <text x="${w * 0.08}" y="${h * 0.30}" fill="#ffffff" opacity="0.9"
      font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(h * 0.06)}"
      letter-spacing="6" font-weight="700">${kicker.toUpperCase()}</text>
    <text x="${w * 0.08}" y="${h * 0.55}" fill="#ffffff"
      font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(h * 0.13)}"
      font-weight="800">${headline}</text>
  </svg>`;
}

async function makeCover(name: string, opts: CoverOpts): Promise<string> {
  const file = path.join(UPLOADS, name);
  await sharp(Buffer.from(coverSvg(opts))).jpeg({ quality: 82 }).toFile(file);
  return `/demo/${name}`;
}

// ---------------------------------------------------------------------------
// Redacción
// ---------------------------------------------------------------------------
const MEMBERS = [
  { key: "dir", displayName: "La Directora", emoji: "☕", role: "admin" as const, code: ADMIN_CODE },
  { key: "becario", displayName: "Becario en Prácticas", emoji: "🤓", role: "member" as const },
  { key: "cafe", displayName: "El del Café", emoji: "🦊", role: "member" as const },
  { key: "rrhh", displayName: "Anónima de RRHH", emoji: "🥸", role: "member" as const },
  { key: "noche", displayName: "Turno de Noche", emoji: "🌙", role: "member" as const },
  { key: "it", displayName: "Soporte IT", emoji: "🤖", role: "member" as const },
];

type ArticleSeed = {
  author: string;
  section: Section;
  size: SizeHint;
  title: string;
  dek?: string;
  body: string;
  cover?: { name: string; from: string; to: string; kicker: string; headline: string };
  stamps: { by: string; type: StampType }[];
  ageHours: number; // antigüedad dentro de la edición
};

const ARTICLES: ArticleSeed[] = [
  {
    author: "cafe",
    section: "noticia",
    size: "destacado",
    title: "La máquina de café vuelve a la vida tras 72 horas de caos",
    dek: "El técnico llegó, miró la máquina, la apagó y la volvió a encender. Funcionó.",
    body: `Tras **tres días** de expresos aguados y un ambiente que rozaba el motín, la máquina de la planta 2 vuelve a operar con normalidad.\n\n"Nunca pensé que echaría de menos su ruido a las 9:00", declaró un compañero de Ventas visiblemente emocionado. La cola llegó a doblar la esquina del office a media mañana.\n\nLa dirección recuerda que *sigue existiendo* la máquina de la planta 3, un dato que, por lo visto, nadie recordaba.`,
    cover: { name: "cafe.jpg", from: "#6f4e37", to: "#2b1a10", kicker: "Portada", headline: "Café, al fin" },
    stamps: [
      { by: "dir", type: "breaking" }, { by: "becario", type: "breaking" }, { by: "noche", type: "breaking" },
      { by: "rrhh", type: "importante" }, { by: "it", type: "importante" }, { by: "becario", type: "gracioso" },
    ],
    ageHours: 5,
  },
  {
    author: "dir",
    section: "noticia",
    size: "normal",
    title: "Fichada la nueva planta del office: un potus llamado Gerardo",
    dek: "La plantilla vegetal crece; la humana, de momento, se mantiene.",
    body: `El comité de bienestar ha adoptado un **potus** que ya preside la mesa alta del office. Fue bautizado *Gerardo* por votación popular en un hilo que, sorprendentemente, sí leyó todo el mundo.\n\nSe busca voluntario para el riego de los lunes. Requisitos: acordarse.`,
    cover: { name: "potus.jpg", from: "#2f6f4e", to: "#123524", kicker: "Oficina", headline: "Hola, Gerardo" },
    stamps: [{ by: "cafe", type: "gracioso" }, { by: "noche", type: "gracioso" }, { by: "becario", type: "importante" }],
    ageHours: 14,
  },
  {
    author: "becario",
    section: "columna",
    size: "normal",
    title: "En defensa de las reuniones que podrían haber sido un email",
    dek: "Un alegato valiente, escrito durante una de ellas.",
    body: `Dicen que esta reunión podría haber sido un correo. Yo digo: ¿y si el correo podría haber sido una reunión que a su vez podría haber sido un correo?\n\nHay algo **profundamente humano** en juntarnos treinta minutos para acordar que lo hablamos por escrito. Larga vida al *"como comentábamos"*.`,
    stamps: [
      { by: "dir", type: "gracioso" }, { by: "cafe", type: "gracioso" }, { by: "rrhh", type: "gracioso" },
      { by: "it", type: "gracioso" }, { by: "noche", type: "rumor" },
    ],
    ageHours: 20,
  },
  {
    author: "rrhh",
    section: "noticia",
    size: "normal",
    title: "El misterio del táper desaparecido: la investigación continúa",
    dek: "Desapareció del frigorífico entre las 13:02 y las 13:07. Sin testigos.",
    body: `Un táper con lentejas de autor se esfumó del segundo estante. La comunidad del office se encuentra **conmocionada**.\n\nFuentes cercanas apuntan a un "aroma sospechoso" procedente de la sala 4. La dirección pide *calma* y etiquetar la comida.`,
    cover: { name: "taper.jpg", from: "#8a5a2b", to: "#3a2410", kicker: "Sucesos", headline: "Caso Táper" },
    stamps: [{ by: "cafe", type: "rumor" }, { by: "noche", type: "rumor" }, { by: "becario", type: "rumor" }, { by: "dir", type: "gracioso" }],
    ageHours: 28,
  },
  {
    author: "it",
    section: "carta_al_director",
    size: "normal",
    title: "Carta al director: ¿quién calentó pescado en el microondas?",
    dek: "Escribo con el corazón encogido y las fosas nasales resentidas.",
    body: `Estimada dirección:\n\nEntiendo que la vida es libre y la merluza, deliciosa. Pero calentarla **tres minutos** a máxima potencia es un acto que rebasa el contrato social del office.\n\nPido, humildemente, un pacto de no agresión olfativa. Atentamente, un compañero que ya no distingue su teclado del mar.`,
    stamps: [
      { by: "dir", type: "gracioso" }, { by: "becario", type: "gracioso" }, { by: "cafe", type: "gracioso" },
      { by: "noche", type: "gracioso" }, { by: "rrhh", type: "importante" },
    ],
    ageHours: 33,
  },
  {
    author: "it",
    section: "noticia",
    size: "normal",
    title: "Segundo monitor en Soporte IT: la productividad se dispara (dicen)",
    dek: "Ahora se puede ignorar el correo en dos pantallas a la vez.",
    body: `El departamento de IT ha instalado un **segundo monitor** en cada puesto. La medida promete duplicar la eficiencia y, con ella, el número de pestañas abiertas sin motivo.\n\n"Es un antes y un después", explica el responsable, mientras arrastra una ventana de una pantalla a otra sin necesidad real.`,
    cover: { name: "monitor.jpg", from: "#33415c", to: "#141b2b", kicker: "Tecnología", headline: "Doble pantalla" },
    stamps: [{ by: "becario", type: "importante" }, { by: "dir", type: "importante" }, { by: "cafe", type: "gracioso" }],
    ageHours: 40,
  },
  {
    author: "dir",
    section: "columna",
    size: "normal",
    title: "El arte de responder «como comentábamos» a un hilo que nadie leyó",
    dek: "Manual de supervivencia en la selva del correo interno.",
    body: `Existe una fórmula mágica capaz de fingir contexto donde no lo hay: *"como comentábamos"*. Añádela al inicio de cualquier respuesta y proyectarás una **autoridad** absoluta sobre un tema que acabas de descubrir.\n\nNivel experto: "retomando el hilo". Nivel leyenda: "para cerrar el loop".`,
    stamps: [{ by: "becario", type: "gracioso" }, { by: "it", type: "gracioso" }, { by: "rrhh", type: "importante" }],
    ageHours: 47,
  },
  {
    author: "noche",
    section: "clima_oficina",
    size: "mini",
    title: "Parte meteorológico: A/A a 19°C, se recomiendan mantas",
    body: `Frente polar estacionado sobre la zona de Contabilidad. Probabilidad de dedos entumecidos: **alta**. Se recomienda capa térmica y té.`,
    stamps: [{ by: "cafe", type: "gracioso" }, { by: "becario", type: "importante" }],
    ageHours: 52,
  },
  {
    author: "noche",
    section: "clima_oficina",
    size: "mini",
    title: "Pronóstico del viernes: nubes de deadline, claros de pizza",
    body: `Ambiente tenso hasta las 17:00, con apertura de cielos y **pizza** al cierre de sprint. Vientos flojos de fin de semana.`,
    stamps: [{ by: "dir", type: "importante" }, { by: "rrhh", type: "gracioso" }],
    ageHours: 58,
  },
  {
    author: "becario",
    section: "clasificado",
    size: "mini",
    title: "Se busca cargador USB-C «tomado prestado» en la sala 3",
    body: `Desapareció el martes. Sin rencores, solo quiero cargar el portátil. Recompensa: un café (cuando la máquina lo permita).`,
    stamps: [{ by: "cafe", type: "gracioso" }],
    ageHours: 64,
  },
  {
    author: "cafe",
    section: "clasificado",
    size: "mini",
    title: "Cambio silla ergonómica que da calambres por uno que no",
    body: `Silla giratoria con *personalidad propia*: gira sola y descarga electricidad estática. Ideal para mantenerse despierto. Abstenerse frioleros.`,
    stamps: [{ by: "becario", type: "gracioso" }, { by: "noche", type: "rumor" }],
    ageHours: 70,
  },
];

// ---------------------------------------------------------------------------
async function main() {
  await mkdir(UPLOADS, { recursive: true });

  // 1) Limpieza idempotente de la room de demo (borrado manual: las FK de libSQL
  //    pueden no estar activas).
  const existing = await db.query.rooms.findFirst({ where: eq(rooms.slug, SLUG) });
  if (existing) {
    const arts = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.roomId, existing.id));
    const artIds = arts.map((a) => a.id);
    if (artIds.length) await db.delete(stamps).where(inArray(stamps.articleId, artIds));
    await db.delete(articles).where(eq(articles.roomId, existing.id));
    await db.delete(roomMembers).where(eq(roomMembers.roomId, existing.id));
    await db.delete(rooms).where(eq(rooms.id, existing.id));
    console.log(`· Room previa "${SLUG}" eliminada`);
  }

  // 2) Room. Edición vigente iniciada hace 3 días (no caducada).
  const editionStartedAt = new Date(Date.now() - 3 * 24 * 3600 * 1000);
  const [room] = await db
    .insert(rooms)
    .values({
      slug: SLUG,
      name: "El Cafetero",
      subtitle: "Todo lo que pasa en la oficina entre café y café",
      editionNumber: 1,
      editionStartedAt,
      createdAt: editionStartedAt,
    })
    .returning();

  // 3) Redacción.
  const memberId: Record<string, string> = {};
  for (const m of MEMBERS) {
    const code = m.code ?? `demo-${m.key}-000`;
    const [row] = await db
      .insert(roomMembers)
      .values({
        roomId: room.id,
        displayName: m.displayName,
        emoji: m.emoji,
        role: m.role,
        secretCodeHash: await hashSecretCode(code),
        createdAt: editionStartedAt,
        lastSeenAt: new Date(),
      })
      .returning();
    memberId[m.key] = row.id;
  }

  // 4) Artículos + portadas + sellos.
  let stampCount = 0;
  for (const a of ARTICLES) {
    const coverImageUrl = a.cover
      ? await makeCover(a.cover.name, {
          w: a.size === "destacado" ? 1280 : 800,
          h: a.size === "destacado" ? 720 : 533,
          from: a.cover.from,
          to: a.cover.to,
          kicker: a.cover.kicker,
          headline: a.cover.headline,
        })
      : null;

    const [article] = await db
      .insert(articles)
      .values({
        roomId: room.id,
        authorMemberId: memberId[a.author],
        editionNumber: room.editionNumber,
        section: a.section,
        title: a.title,
        dek: a.dek ?? null,
        body: a.body,
        coverImageUrl,
        sizeHint: a.size,
        createdAt: new Date(Date.now() - a.ageHours * 3600 * 1000),
      })
      .returning();

    if (a.stamps.length) {
      await db.insert(stamps).values(
        a.stamps.map((s) => ({
          articleId: article.id,
          memberId: memberId[s.by],
          stampType: s.type,
        })),
      );
      stampCount += a.stamps.length;
    }
  }

  console.log("\n✔ Demo lista");
  console.log(`  Room:      ${room.name}  (/${room.slug})`);
  console.log(`  Redacción: ${MEMBERS.length} miembros`);
  console.log(`  Artículos: ${ARTICLES.length}  ·  Sellos: ${stampCount}`);
  console.log("\n  Entrar como editora:");
  console.log(`    http://localhost:3000/entrar?room=${room.slug}`);
  console.log(`    código secreto: ${ADMIN_CODE}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
