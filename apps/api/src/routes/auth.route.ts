import { Elysia, t } from 'elysia';
import { db } from '../db';
import { signJwt, verifyJwt, type JwtPayload } from '../utils/jwt';
import { verifyPassword } from '../utils/password';
import { sendApiError } from '../utils/api-error';
import { createRouteLogger } from '../utils/logger';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

const invalidCredentialsResponse = (set: { status?: number }) =>
  sendApiError(set, {
    status: 401,
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password',
  });

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post(
    '/login',
    async ({ body, set, headers }) => {
      const routeLogger = createRouteLogger({ headers, route: 'POST /api/auth/login' });
      const { email, password } = body;
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        routeLogger.error('AUTH_UNAVAILABLE', { event: 'AUTH_UNAVAILABLE' });
        return sendApiError(set, {
          status: 500,
          code: 'AUTH_UNAVAILABLE',
          message: 'Authentication unavailable',
        });
      }

      const user = await db.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        return invalidCredentialsResponse(set);
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return invalidCredentialsResponse(set);
      }

      const accessToken = signJwt(
        { userId: user.id, tokenType: 'access', expiresIn: ACCESS_TOKEN_TTL_SECONDS },
        secret
      );
      const refreshToken = signJwt(
        { userId: user.id, tokenType: 'refresh', expiresIn: REFRESH_TOKEN_TTL_SECONDS },
        secret
      );

      return {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
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
    '/refresh',
    async ({ body, set, headers }) => {
      const routeLogger = createRouteLogger({ headers, route: 'POST /api/auth/refresh' });
      const { refreshToken } = body;
      const secret = process.env.JWT_SECRET;

      if (!secret) {
        routeLogger.error('AUTH_UNAVAILABLE', { event: 'AUTH_UNAVAILABLE' });
        return sendApiError(set, {
          status: 500,
          code: 'AUTH_UNAVAILABLE',
          message: 'Authentication unavailable',
        });
      }

      const result = verifyJwt<JwtPayload>(refreshToken, secret);
      if (!result.valid || result.payload.tokenType !== 'refresh') {
        return sendApiError(set, {
          status: 401,
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        });
      }

      const accessToken = signJwt(
        { userId: result.payload.userId, tokenType: 'access', expiresIn: ACCESS_TOKEN_TTL_SECONDS },
        secret
      );
      const newRefreshToken = signJwt(
        {
          userId: result.payload.userId,
          tokenType: 'refresh',
          expiresIn: REFRESH_TOKEN_TTL_SECONDS,
        },
        secret
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String({ minLength: 1 }),
      }),
    }
  );
