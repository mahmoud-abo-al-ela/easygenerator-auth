import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AUTH_MESSAGES, VALIDATION_MESSAGES as MSG } from "../lib/validation-contract.ts";
import { json, renderApp, USER } from "../test/render-app.tsx";

async function fillValidForm(user: ReturnType<typeof renderApp>["user"]) {
  await user.type(screen.getByLabelText("Email"), "  Jane@Example.com ");
  await user.type(screen.getByLabelText("Name"), "Jane Doe");
  await user.type(screen.getByLabelText("Password"), "S3cure!pass");
}

describe("SignUpPage", () => {
  it("validates a field when the user leaves it", async () => {
    const { user } = renderApp("/sign-up");
    await user.click(await screen.findByLabelText("Email"));
    await user.tab();

    expect(await screen.findByText(MSG.email.required)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("updates the password checklist while typing", async () => {
    const { user } = renderApp("/sign-up");
    const password = await screen.findByLabelText("Password");
    const list = screen.getByRole("list");

    expect(within(list).getAllByText("(not yet)")).toHaveLength(4);
    await user.type(password, "abc1");
    expect(within(list).getAllByText("(done)")).toHaveLength(2);
    await user.type(password, "!xyz");
    expect(within(list).getAllByText("(done)")).toHaveLength(4);
    expect(screen.getByText("4 of 4 password requirements met")).toBeInTheDocument();
  });

  it("does not submit while the form is invalid", async () => {
    const { user, fetchMock } = renderApp("/sign-up");
    await user.click(await screen.findByRole("button", { name: "Create account" }));

    expect(await screen.findByText(MSG.password.required)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1); // only the session check
  });

  it("shows server field errors under the matching input", async () => {
    const { user } = renderApp("/sign-up", {
      "POST /api/auth/sign-up": () =>
        json(400, { message: MSG.summary, errors: { name: ["Server rejected this name"] } }),
    });
    await screen.findByLabelText("Email");
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Server rejected this name")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
  });

  it("shows a form-level alert when the email is taken", async () => {
    const { user } = renderApp("/sign-up", {
      "POST /api/auth/sign-up": () => json(409, { message: AUTH_MESSAGES.emailTaken }),
    });
    await screen.findByLabelText("Email");
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(AUTH_MESSAGES.emailTaken);
  });

  it("sends normalized data and opens the app on success", async () => {
    let sent: unknown;
    const { user } = renderApp("/sign-up", {
      "POST /api/auth/sign-up": (body) => {
        sent = body;
        return json(201, USER);
      },
    });
    await screen.findByLabelText("Email");
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByRole("heading", { name: "Welcome to the application." }),
    ).toBeInTheDocument();
    expect(sent).toEqual({ email: "jane@example.com", name: "Jane Doe", password: "S3cure!pass" });
  });
});
