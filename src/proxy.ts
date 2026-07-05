import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth-constants";

// Renovación rolling: cada visita reemite la cookie con Max-Age completo,
// así la sesión solo caduca tras ~400 días de inactividad.
export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = request.cookies.get(SESSION_COOKIE);
  if (session?.value) {
    response.cookies.set(SESSION_COOKIE, session.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
