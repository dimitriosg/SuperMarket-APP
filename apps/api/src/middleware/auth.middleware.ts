import { Elysia } from "elysia";
import { verifyJwt, type JwtPayload } from "../utils/jwt";
import { getRequestId } from "../utils/logger";

export const authMiddleware = new Elysia({ name: "authMiddleware" })
  .derive(({ headers, set }) => {
    const authHeader = headers.authorization ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) {
      set.status = 401;
      return { userId: undefined as string | undefined, authError: true };
    }

    const result = verifyJwt<JwtPayload>(token, secret);
    if (!result.valid || result.payload.tokenType !== "access") {
      set.status = 401;
      return { userId: undefined as string | undefined, authError: true };
    }

    return { userId: result.payload.userId, authError: false };
  })
  .onBeforeHandle(({ authError, set, headers }) => {
    if (authError) {
      const requestId = getRequestId(headers);
      set.status = 401;
      return { error: { code: "UNAUTHORIZED", message: "Unauthorized", requestId } };
    }
  });
