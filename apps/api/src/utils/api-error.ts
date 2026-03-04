import type { StatusMap } from 'elysia';

type SetStatus = { status?: number };

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const buildApiError = (params: {
  code: string;
  message: string;
  details?: unknown;
}): ApiError => ({
  error: {
    code: params.code,
    message: params.message,
    ...(params.details !== undefined ? { details: params.details } : {}),
  },
});

export const sendApiError = (
  set: SetStatus,
  params: {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  }
): ApiError => {
  set.status = params.status as keyof StatusMap;
  return buildApiError({
    code: params.code,
    message: params.message,
    details: params.details,
  });
};
