import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NETWORK_ERROR_MESSAGE } from "../lib/api.ts";
import { AUTH_MESSAGES, VALIDATION_MESSAGES as MSG } from "../lib/validation-contract.ts";
import { json, renderApp, USER } from "../test/render-app.tsx";

async function submit(user: ReturnType<typeof renderApp>["user"], password = "whatever") {
  await user.type(await screen.findByLabelText("Email"), "jane@example.com");
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("SignInPage", () => {
  it("only asks for a password, without revealing the password rules", async () => {
    const { user } = renderApp("/sign-in");
    await user.click(await screen.findByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(MSG.signInPassword.required)).toBeInTheDocument();
    expect(screen.queryByText(MSG.password.tooShort)).not.toBeInTheDocument();
  });

  it("shows the generic message for wrong credentials", async () => {
    const { user } = renderApp("/sign-in", {
      "POST /api/auth/sign-in": () => json(401, { message: AUTH_MESSAGES.invalidCredentials }),
    });
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(AUTH_MESSAGES.invalidCredentials);
  });

  it("explains when the server can't be reached", async () => {
    const { user } = renderApp("/sign-in", {
      "POST /api/auth/sign-in": () => Promise.reject(new TypeError("Failed to fetch")),
    });
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_ERROR_MESSAGE);
  });

  it("opens the app after signing in", async () => {
    const { user } = renderApp("/sign-in", {
      "POST /api/auth/sign-in": () => json(200, USER),
    });
    await submit(user, "S3cure!pass");

    expect(
      await screen.findByRole("heading", { name: "Welcome to the application." }),
    ).toBeInTheDocument();
  });
});
