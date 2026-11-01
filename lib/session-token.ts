export const SESSION_COOKIE_NAME = "studysync_session";

export type SessionClaims = {
  sub: number;
  jti: string;
  exp: number;
};

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }

  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  const payload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    await signingKey(),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined) return null;
    const decodedSignature = decodeBase64Url(signature);
    const signatureBuffer = new ArrayBuffer(decodedSignature.byteLength);
    new Uint8Array(signatureBuffer).set(decodedSignature);
    const valid = await globalThis.crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      signatureBuffer,
      new TextEncoder().encode(payload),
    );
    if (!valid) return null;

    const claims: unknown = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
    if (
      !claims ||
      typeof claims !== "object" ||
      !("sub" in claims) ||
      !("jti" in claims) ||
      !("exp" in claims) ||
      typeof claims.sub !== "number" ||
      !Number.isSafeInteger(claims.sub) ||
      typeof claims.jti !== "string" ||
      !/^[a-f0-9]{64}$/.test(claims.jti) ||
      typeof claims.exp !== "number" ||
      !Number.isSafeInteger(claims.exp) ||
      claims.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { sub: claims.sub, jti: claims.jti, exp: claims.exp };
  } catch {
    return null;
  }
}
