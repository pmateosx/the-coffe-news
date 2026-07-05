// Compartido entre el proxy (edge) y auth.ts (Node): sin dependencias de runtime.
export const SESSION_COOKIE = "coffee_session";
// Máximo práctico que respetan los navegadores (~400 días).
export const SESSION_MAX_AGE = 400 * 24 * 60 * 60;
