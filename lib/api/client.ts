/**
 * HTTP client for the Partner Club WhatsApp Marketing System API.
 *
 * Every request goes through here so that the response envelope
 * (`{ success, data, meta }`), the error taxonomy (`ApiError`) and access-token
 * attachment are handled in exactly one place. The backend enforces the
 * consent/eligibility and approval rules, so the client never re-derives them.
 *
 * The refresh token is an HTTP-only cookie, which is why `credentials` is
 * always `include`: a `401` triggers one silent refresh-and-retry.
 */

/** Base URL of the versioned API. */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
).replace(/\/+$/, "");

/** A single field-level validation message returned by the API. */
export interface ApiFieldError {
  path: string;
  message: string;
}

/** Error codes the API can return, plus the two the client adds itself. */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

/**
 * A failed API call.
 *
 * Carries the machine-readable `code`, the HTTP `status` and any per-field
 * `details` so forms can attach messages to the right input.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ApiFieldError[];

  constructor(status: number, code: ApiErrorCode, message: string, details: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the caller is not (or is no longer) authenticated. */
  get isAuthError(): boolean {
    return this.status === 401;
  }

  /** True when the caller is signed in but lacks the required role. */
  get isPermissionError(): boolean {
    return this.status === 403;
  }

  /** Field errors keyed by input name, ready for react-hook-form `setError`. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const detail of this.details) {
      if (detail.path && !map[detail.path]) map[detail.path] = detail.message;
    }
    return map;
  }
}

/** Values accepted in a query string; `undefined`, `null` and `""` are dropped. */
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly (string | number)[];

/** Pagination metadata returned alongside list data. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Unwrapped success response. */
export interface ApiResult<T> {
  data: T;
  meta?: Partial<PaginationMeta> & Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Access token                                                       */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;

/** Set (or clear) the in-memory access token used for subsequent requests. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Called once when a request fails with 401. The session registers its refresh
 * routine here; returning `true` means a new token is available and the request
 * can be retried. Keeping it as a hook avoids an import cycle with the session.
 */
type RefreshHandler = () => Promise<boolean>;

let refreshHandler: RefreshHandler | null = null;

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

/* ------------------------------------------------------------------ */
/* Request plumbing                                                   */
/* ------------------------------------------------------------------ */

export function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      // Repeated keys: Express's qs parser turns `?p=A&p=B` into ["A", "B"].
      for (const entry of value) search.append(key, String(entry));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Set to `false` for public endpoints to skip the Authorization header. */
  auth?: boolean;
  /** Pass through a raw response body as text (CSV exports). */
  text?: boolean;
}

function parseEnvelope(payload: unknown): ApiResult<unknown> {
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; meta?: ApiResult<unknown>["meta"] };
    if ("data" in record) return { data: record.data, meta: record.meta };
  }
  return { data: payload };
}

async function toApiError(response: Response): Promise<ApiError> {
  const status = response.status;
  let code: ApiErrorCode = "UNKNOWN";
  let message = `Request failed with status ${status}.`;
  let details: ApiFieldError[] = [];

  try {
    const payload = (await response.json()) as {
      error?: { code?: string; message?: string; details?: ApiFieldError[] };
    };
    if (payload.error) {
      if (payload.error.code) code = payload.error.code as ApiErrorCode;
      if (payload.error.message) message = payload.error.message;
      if (Array.isArray(payload.error.details)) details = payload.error.details;
    }
  } catch {
    // A non-JSON error body (proxy, gateway) keeps the generic message.
  }

  if (code === "UNKNOWN") {
    if (status === 401) code = "UNAUTHORIZED";
    else if (status === 403) code = "FORBIDDEN";
    else if (status === 404) code = "NOT_FOUND";
    else if (status === 409) code = "CONFLICT";
    else if (status === 422 || status === 400) code = "VALIDATION_ERROR";
    else if (status === 429) code = "RATE_LIMITED";
    else if (status >= 500) code = "INTERNAL_ERROR";
  }

  return new ApiError(status, code, message, details);
}

/**
 * Perform an API request and return the unwrapped envelope.
 *
 * @throws {ApiError} on any non-2xx response or transport failure.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, query, signal, auth = true, text = false } = options;
  const url = `${API_BASE_URL}${path}${query ? buildQuery(query) : ""}`;

  const send = async (): Promise<Response> => {
    const headers = new Headers({ Accept: text ? "text/csv, text/plain, */*" : "application/json" });
    if (body !== undefined) headers.set("Content-Type", "application/json");
    if (auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

    return fetch(url, {
      method,
      headers,
      credentials: "include",
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response: Response;
  try {
    response = await send();

    // One silent refresh, then one retry. `refreshHandler` is single-flight, so
    // parallel 401s collapse into a single refresh call.
    if (response.status === 401 && auth && refreshHandler) {
      const refreshed = await refreshHandler();
      if (refreshed) response = await send();
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the server. Check your connection and try again.");
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return { data: undefined as T };

  if (text) {
    return { data: (await response.text()) as unknown as T };
  }

  try {
    return parseEnvelope(await response.json()) as ApiResult<T>;
  } catch {
    throw new ApiError(response.status, "INTERNAL_ERROR", "The server returned an unreadable response.");
  }
}

/** Convenience wrapper returning only the `data` member of the envelope. */
export async function apiData<T>(path: string, options?: RequestOptions): Promise<T> {
  const { data } = await apiRequest<T>(path, options);
  return data;
}

/** A page of results, flattened from the envelope. */
export interface ListResult<T> extends PaginationMeta {
  items: T[];
}

/** Flatten `{ data, meta }` from a list endpoint into `{ items, page, … }`. */
export function toListResult<T>(
  data: T[],
  meta: ApiResult<T[]>["meta"],
  page: number,
  limit: number,
): ListResult<T> {
  const total = Number(meta?.total ?? data.length);
  return {
    items: data,
    page: Number(meta?.page ?? page),
    limit: Number(meta?.limit ?? limit),
    total,
    totalPages: Number(meta?.totalPages ?? Math.max(1, Math.ceil(total / limit))),
  };
}
