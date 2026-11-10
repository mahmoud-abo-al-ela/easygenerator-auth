import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { json, renderApp, USER } from "./test/render-app.tsx";

const signedIn = { "GET /api/users/me": () => json(200, USER) };

describe("routes", () => {
  it("sends signed-out visitors from the app to sign-in", async () => {
    const { router } = renderApp("/");

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("shows the welcome page with the user's details when signed in", async () => {
    renderApp("/", signedIn);

    expect(
      await screen.findByRole("heading", { name: "Welcome to the application." }),
    ).toBeInTheDocument();
    expect(screen.getByText(USER.name)).toBeInTheDocument();
  });

  it("sends signed-in users away from sign-in and sign-up", async () => {
    const { router } = renderApp("/sign-up", signedIn);

    expect(
      await screen.findByRole("heading", { name: "Welcome to the application." }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("logs out and returns to sign-in", async () => {
    const { user, router } = renderApp("/", {
      ...signedIn,
      "POST /api/auth/sign-out": () => json(204),
    });
    await user.click(await screen.findByRole("button", { name: "Log out" }));

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/sign-in");
  });

  it("redirects unknown paths to the app", async () => {
    const { router } = renderApp("/nope", signedIn);

    expect(
      await screen.findByRole("heading", { name: "Welcome to the application." }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });
});
