// Minimal single-operator admin gate. There is no admin role in the DB —
// the admin screen is for Naoki only, so a shared password + HMAC session
// cookie is enough for MVP. Uses Web Crypto so it also works in the Edge
// middleware runtime.

export const ADMIN_SESSION_COOKIE = "imakoko_admin_session";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return toHex(signature);
}

export async function createAdminSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET!;
  return sign(secret, "admin-session");
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  return password.length > 0 && password === process.env.ADMIN_PASSWORD;
}

export async function isValidAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const expected = await createAdminSessionToken();
  return token === expected;
}
