import { timingSafeEqual } from "node:crypto";

export const verifyPassword = async (password: string, passwordHash: string) => {
  if (typeof Bun !== "undefined" && Bun.password) {
    return Bun.password.verify(password, passwordHash);
  }

  const passwordBuffer = Buffer.from(password);
  const hashBuffer = Buffer.from(passwordHash);
  if (passwordBuffer.length !== hashBuffer.length) {
    return false;
  }

  return timingSafeEqual(passwordBuffer, hashBuffer);
};
