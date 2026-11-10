import { describe, expect, it } from "vitest";
import { PASSWORD_RULES, signInSchema, signUpSchema } from "./auth-schemas.ts";
import { VALIDATION_MESSAGES as MSG } from "./validation-contract.ts";

const valid = { email: "jane@example.com", name: "Jane", password: "S3cure!pass" };

function errorsFor(input: Record<string, unknown>) {
  const result = signUpSchema.safeParse(input);
  if (result.success) return {};
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
}

describe("signUpSchema", () => {
  it("accepts a valid payload and normalizes email and name", () => {
    expect(
      signUpSchema.parse({ ...valid, email: "  Jane@Example.COM ", name: " Jane " }),
    ).toEqual({ ...valid, email: "jane@example.com", name: "Jane" });
  });

  it.each(["", "   "])("asks for the email when it is %j", (email) => {
    expect(errorsFor({ ...valid, email })).toEqual({ email: [MSG.email.required] });
  });

  it("explains the expected email format", () => {
    expect(errorsFor({ ...valid, email: "nope" })).toEqual({ email: [MSG.email.invalid] });
  });

  it.each([
    ["Jo", MSG.name.tooShort],
    ["   Jo   ", MSG.name.tooShort],
    ["a".repeat(51), MSG.name.tooLong],
  ])("rejects name %j", (name, message) => {
    expect(errorsFor({ ...valid, name })).toEqual({ name: [message] });
  });

  it("accepts names of exactly 3 and 50 characters", () => {
    expect(errorsFor({ ...valid, name: "Ann" })).toEqual({});
    expect(errorsFor({ ...valid, name: "a".repeat(50) })).toEqual({});
  });

  it.each([
    ["", [MSG.password.required]],
    ["Abcdefg!", [MSG.password.number]],
    ["1234567!", [MSG.password.letter]],
    ["Abcdefg1", [MSG.password.specialChar]],
    ["Abc defg1", [MSG.password.specialChar]],
    ["Ab1!xyz", [MSG.password.tooShort]],
    [`A1!${"a".repeat(126)}`, [MSG.password.tooLong]],
    ["abc", [MSG.password.tooShort, MSG.password.number, MSG.password.specialChar]],
  ])("reports the unmet rules for %j", (password, messages) => {
    expect(errorsFor({ ...valid, password })).toEqual({ password: messages });
  });

  it.each(["Abcdef1!", "Pass word 1!", `A1!${"a".repeat(125)}`])(
    "accepts password %j",
    (password) => {
      expect(errorsFor({ ...valid, password })).toEqual({});
    },
  );
});

describe("signInSchema", () => {
  it("only requires a non-empty password", () => {
    expect(signInSchema.safeParse({ email: "jane@example.com", password: "x" }).success).toBe(true);
    const result = signInSchema.safeParse({ email: "jane@example.com", password: "" });
    expect(result.error?.issues.map((i) => i.message)).toEqual([MSG.signInPassword.required]);
  });
});

describe("PASSWORD_RULES", () => {
  it("agrees with the schema: a password passing every rule is valid", () => {
    const password = "Abcdef1!";
    expect(PASSWORD_RULES.every((rule) => rule.test(password))).toBe(true);
    expect(errorsFor({ ...valid, password })).toEqual({});
  });

  it("does not count whitespace as a special character", () => {
    const special = PASSWORD_RULES.find((r) => r.id === "specialChar");
    expect(special?.test("Abcdefg1 ")).toBe(false);
  });
});
