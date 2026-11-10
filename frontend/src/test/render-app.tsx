import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider.tsx";
import { routes } from "../routes.tsx";

export const USER = {
  id: "u1",
  email: "jane@example.com",
  name: "Jane Doe",
  createdAt: "2026-01-01T00:00:00.000Z",
};

type Handler = (body: unknown) => Response | Promise<Response>;

export function json(status: number, body?: unknown): Response {
  if (status === 204) return new Response(null, { status });
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Renders the real app (routes + AuthProvider) at `path`, with `fetch` mocked.
 * Handlers are keyed by "METHOD /path"; GET /users/me defaults to signed out.
 */
export function renderApp(path: string, handlers: Record<string, Handler> = {}) {
  const all: Record<string, Handler> = {
    "GET /api/users/me": () => json(401, { message: "Unauthorized" }),
    ...handlers,
  };
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const key = `${init?.method ?? "GET"} ${String(input)}`;
    const handler = all[key];
    if (!handler) throw new Error(`Unexpected request: ${key}`);
    return handler(init?.body ? JSON.parse(String(init.body)) : undefined);
  });

  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  );
  return { user: userEvent.setup(), fetchMock, router };
}
