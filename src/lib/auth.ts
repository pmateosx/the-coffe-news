import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-constants";

export { SESSION_COOKIE, SESSION_MAX_AGE };

// Una persona puede pertenecer a varias rooms: roomId -> memberId.
type SessionPayload = {
  v: 1;
  rooms: Record<string, string>;
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("Falta SESSION_SECRET en el entorno");
  return value;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

function encode(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function decode(value: string): SessionPayload | null {
  const [data, sig] = value.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload?.v === 1 && payload.rooms && typeof payload.rooms === "object") {
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function readSession(): Promise<SessionPayload> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return (raw && decode(raw)) || { v: 1, rooms: {} };
}

/** Solo puede llamarse desde Server Actions o Route Handlers. */
export async function setRoomSession(roomId: string, memberId: string): Promise<void> {
  const session = await readSession();
  session.rooms[roomId] = memberId;
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearRoomSession(roomId: string): Promise<void> {
  const session = await readSession();
  delete session.rooms[roomId];
  const store = await cookies();
  store.set(SESSION_COOKIE, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}
