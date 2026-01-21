import { randomUUID } from "node:crypto";
import fs from "node:fs";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const env = process.env.NODE_ENV ?? "development";
const isProduction = env === "production";

const logDirectory = process.env.LOG_DIR ?? "logs";

if (isProduction) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const ensureContext = winston.format((info) => {
  info.request_id = info.request_id ?? "system";
  info.userId = info.userId ?? "system";
  return info;
});

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  ensureContext(),
  winston.format.json()
);

const transports: winston.transport[] = [];

if (isProduction) {
  transports.push(
    new DailyRotateFile({
      dirname: logDirectory,
      filename: "api-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxFiles: "14d",
    })
  );
} else {
  transports.push(new winston.transports.Console({ format: baseFormat }));
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: baseFormat,
  defaultMeta: {
    service: "api",
    environment: env,
  },
  transports,
});

export const createRequestLogger = (context: {
  requestId?: string;
  userId?: string;
}) =>
  logger.child({
    request_id: context.requestId ?? "system",
    userId: context.userId ?? "system",
  });

export const resolveRequestId = (headers?: Headers | Record<string, string | undefined>) => {
  if (!headers) return undefined;
  if (headers instanceof Headers) {
    return headers.get("x-request-id") ?? undefined;
  }

  const headerValue = headers["x-request-id"] ?? headers["x-requestid"];
  return typeof headerValue === "string" ? headerValue : undefined;
};

export const getRequestId = (headers?: Headers | Record<string, string | undefined>) =>
  resolveRequestId(headers) ?? randomUUID();

export const resolveUserId = (headers?: Headers | Record<string, string | undefined>) => {
  if (!headers) return "guest";
  if (headers instanceof Headers) {
    return headers.get("x-user-id") ?? headers.get("x-userid") ?? "guest";
  }

  const headerValue = headers["x-user-id"] ?? headers["x-userid"];
  return typeof headerValue === "string" ? headerValue : "guest";
};
