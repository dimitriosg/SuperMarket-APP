import { Elysia, t } from "elysia";
import { db } from "../db";
import { signJwt, verifyJwt, type JwtPayload } from "../utils/jwt";
import { getRequestId } from "../utils/logger";
import { verifyPassword } from "../utils/password";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const invalidCredentialsResponse = (set: { status?: number | string }, requestId: string) => {
  set.status = 401;
  return { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password", requestId } };
};

export const createAuthRoutes = () =>
  new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, set, headers }) => {
      const { email, password } = body;
      const secret = process.env.JWT_SECRET;
      const requestId = getRequestId(headers);

      if (!secret) {
        set.status = 500;
        return { error: { code: "AUTH_UNAVAILABLE", message: "Authentication unavailable", requestId } };
      }

      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        return invalidCredentialsResponse(set, requestId);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return invalidCredentialsResponse(set, requestId);
      }

      const accessToken = signJwt(
        { userId: user.id, tokenType: "access", expiresIn: ACCESS_TOKEN_TTL_SECONDS },
        secret
      );
      const refreshToken = signJwt(
        { userId: user.id, tokenType: "refresh", expiresIn: REFRESH_TOKEN_TTL_SECONDS },
        secret
      );

      return {
        accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      };
    },
    {
      body: t.Object({
        email: t.String({ minLength: 5, maxLength: 254 }),
        password: t.String({ minLength: 8, maxLength: 1024 }),
      }),
    }
  )
  .post(
    "/refresh",
    async ({ body, set, headers }) => {
      const { refreshToken } = body;
      const secret = process.env.JWT_SECRET;
      const requestId = getRequestId(headers);

      if (!secret) {
        set.status = 500;
        return { error: { code: "AUTH_UNAVAILABLE", message: "Authentication unavailable", requestId } };
      }

      const result = verifyJwt<JwtPayload>(refreshToken, secret);
      if (!result.valid || result.payload.tokenType !== "refresh") {
        set.status = 401;
        return { error: { code: "INVALID_TOKEN", message: "Invalid refresh token", requestId } };
      }

      const accessToken = signJwt(
        { userId: result.payload.userId, tokenType: "access", expiresIn: ACCESS_TOKEN_TTL_SECONDS },
        secret
      );
      const newRefreshToken = signJwt(
        { userId: result.payload.userId, tokenType: "refresh", expiresIn: REFRESH_TOKEN_TTL_SECONDS },
        secret
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: "Bearer",
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 1 }),
      }),
    }
  );


export const authRoutes = createAuthRoutes();
