export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export type FieldErrors = Record<string, string[]>;

export const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check your connection and try again.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** An HTTP error from the API, in the backend's `{ message, errors? }` shape. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const API_BASE = "/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      // The session lives in an httpOnly cookie; it must travel with every request.
      credentials: "include",
      headers: init.body
        ? { "Content-Type": "application/json", ...init.headers }
        : init.headers,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return undefined as T;

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) throw toApiError(response.status, body);
  return body as T;
}

function toApiError(status: number, body: unknown): ApiError {
  if (typeof body !== "object" || body === null) {
    return new ApiError(status, UNEXPECTED_ERROR_MESSAGE);
  }
  const { message, errors } = body as { message?: unknown; errors?: unknown };
  return new ApiError(
    status,
    typeof message === "string" ? message : UNEXPECTED_ERROR_MESSAGE,
    typeof errors === "object" && errors !== null
      ? (errors as FieldErrors)
      : undefined,
  );
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const api = {
  signUp: (data: { email: string; name: string; password: string }) =>
    post<User>("/auth/sign-up", data),
  signIn: (data: { email: string; password: string }) =>
    post<User>("/auth/sign-in", data),
  signOut: () => post<void>("/auth/sign-out"),
  getMe: () => request<User>("/users/me"),
};
