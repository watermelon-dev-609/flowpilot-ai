export enum ApiErrorCode {
  ValidationError = "VALIDATION_ERROR",
  Unauthorized = "UNAUTHORIZED",
  Forbidden = "FORBIDDEN",
  NotFound = "NOT_FOUND",
  Conflict = "CONFLICT",
  RateLimited = "RATE_LIMITED",
  InternalError = "INTERNAL_ERROR"
}

export type ApiSuccess<T> = {
  ok: true;
  code: "OK";
  msg: string;
  data: T;
  traceId?: string;
};

export type ApiFieldError = {
  field: string;
  message: string;
};

export type ApiError = {
  ok: false;
  code: ApiErrorCode;
  msg: string;
  data: null;
  traceId?: string;
  details?: ApiFieldError[];
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type PaginatedData<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function createApiSuccess<T>({
  data,
  msg = "请求成功",
  traceId
}: {
  data: T;
  msg?: string;
  traceId?: string;
}): ApiSuccess<T> {
  return {
    ok: true,
    code: "OK",
    msg,
    data,
    traceId
  };
}

export function createApiError({
  code,
  msg,
  traceId,
  details
}: {
  code: ApiErrorCode;
  msg: string;
  traceId?: string;
  details?: ApiFieldError[];
}): ApiError {
  return {
    ok: false,
    code,
    msg,
    data: null,
    traceId,
    details
  };
}

export function createPaginatedResponse<T>({
  items,
  page,
  pageSize,
  total,
  traceId
}: {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  traceId?: string;
}): ApiSuccess<PaginatedData<T>> {
  const safePage = normalizePositiveInteger(page, 1);
  const safePageSize = normalizePositiveInteger(pageSize, 10);
  const safeTotal = Math.max(0, Math.trunc(total));

  return createApiSuccess({
    data: {
      items,
      page: safePage,
      pageSize: safePageSize,
      total: safeTotal,
      totalPages: Math.ceil(safeTotal / safePageSize)
    },
    traceId
  });
}

function normalizePositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const normalized = Math.trunc(value);
  return normalized > 0 ? normalized : fallback;
}
