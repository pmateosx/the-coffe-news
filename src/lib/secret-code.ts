import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

// Palabras cortas, sin tildes ni eñes, fáciles de apuntar a mano.
const ANIMALS = [
  "lince", "zorro", "lobo", "oso", "puma", "tigre", "leon", "gato",
  "ciervo", "alce", "tejon", "nutria", "castor", "erizo", "conejo", "liebre",
  "ardilla", "raton", "topo", "cuervo", "halcon", "aguila", "buho", "garza",
  "cisne", "pato", "gallo", "mirlo", "tucan", "loro", "delfin", "ballena",
  "pulpo", "foca", "morsa", "atun", "salmon", "rana", "tortuga", "lagarto",
  "abeja", "grillo", "bison", "cabra", "potro", "mula", "vaca", "toro",
  "cerdo", "pavo", "corzo", "jabali", "gamo", "vencejo", "urraca", "perdiz",
  "trucha", "merluza", "sepia", "gamba", "cangrejo", "caracol", "polilla", "avispa",
] as const;

const MATERIALS = [
  "cobre", "plata", "oro", "bronce", "hierro", "acero", "jade", "ambar",
  "coral", "perla", "marfil", "ebano", "roble", "pino", "cedro", "arce",
  "mimbre", "lino", "seda", "lana", "cuero", "barro", "arcilla", "granito",
  "marmol", "basalto", "cuarzo", "topacio", "rubi", "zafiro", "opalo", "onice",
  "grafito", "carbon", "ceniza", "niebla", "musgo", "salvia", "ocre", "indigo",
  "cristal", "vidrio", "yeso", "caliza", "silex", "pizarra", "arena", "grava",
  "papel", "carton", "tiza", "cera", "resina", "corcho", "bambu", "junco",
  "esparto", "canela", "cacao", "cafe", "trigo", "avena", "salitre", "azufre",
] as const;

function pick<T>(list: readonly T[]): T {
  return list[crypto.randomInt(list.length)];
}

/** Genera un código legible tipo "lince-cobre-482". */
export function generateSecretCode(): string {
  const num = crypto.randomInt(100, 1000);
  return `${pick(ANIMALS)}-${pick(MATERIALS)}-${num}`;
}

/** Normaliza lo que teclea el usuario: espacios, mayúsculas, tildes. */
export function normalizeSecretCode(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[\s_.,;]+/g, "-")
    .replace(/-+/g, "-");
}

const KEY_LENGTH = 32;

export async function hashSecretCode(code: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(normalizeSecretCode(code), salt, KEY_LENGTH);
  return `s1:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export async function verifySecretCode(code: string, stored: string): Promise<boolean> {
  const [version, saltB64, hashB64] = stored.split(":");
  if (version !== "s1" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scrypt(
    normalizeSecretCode(code),
    Buffer.from(saltB64, "base64url"),
    KEY_LENGTH,
  );
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
