import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtTokenType = "access" | "refresh";

export interface JwtPayload {
  userId: string;
  tokenType: JwtTokenType;
  iat: number;
  exp: number;
}

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
} as const;

const base64UrlEncode = (input: Buffer | string): string => {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

const base64UrlDecode = (input: string): string => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return Buffer.from(padded, "base64").toString("utf8");
};

export const signJwt = (payload: Omit<JwtPayload, "iat" | "exp"> & { expiresIn: number }, secret: string) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    userId: payload.userId,
    tokenType: payload.tokenType,
    iat: issuedAt,
    exp: issuedAt + payload.expiresIn,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(JWT_HEADER));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", secret).update(data).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${data}.${encodedSignature}`;
};

export const verifyJwt = <T extends JwtPayload>(token: string, secret: string) => {
  const segments = token.split(".");
  if (segments.length !== 3) {
    return { valid: false, reason: "invalid" } as const;
  }

  const [encodedHeader, encodedPayload, signature] = segments;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac("sha256", secret).update(data).digest();
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(base64UrlEncode(expectedSignature));

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: "invalid" } as const;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, reason: "invalid" } as const;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as T;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || now >= payload.exp) {
      return { valid: false, reason: "expired" } as const;
    }

    return { valid: true, payload } as const;
  } catch {
    return { valid: false, reason: "invalid" } as const;
  }
};
