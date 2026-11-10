import { z } from "zod";
import {
  HAS_LETTER,
  HAS_NUMBER,
  HAS_SPECIAL_CHAR,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  VALIDATION_MESSAGES as MSG,
} from "./validation-contract.ts";

export interface PasswordRule {
  id: "length" | "letter" | "number" | "specialChar";
  label: string;
  test: (password: string) => boolean;
}

/** The password rules in display order; shared by the schema and the live checklist. */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} or more characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "letter", label: "A letter", test: (p) => HAS_LETTER.test(p) },
  { id: "number", label: "A number", test: (p) => HAS_NUMBER.test(p) },
  {
    id: "specialChar",
    label: "A special character",
    test: (p) => HAS_SPECIAL_CHAR.test(p),
  },
];

// `.pipe()` makes "required" short-circuit, so an empty field shows only that message.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, MSG.email.required)
  .pipe(z.email(MSG.email.invalid));

export const signUpSchema = z.object({
  email,
  name: z
    .string()
    .trim()
    .min(1, MSG.name.required)
    .pipe(
      z
        .string()
        .min(NAME_MIN_LENGTH, MSG.name.tooShort)
        .max(NAME_MAX_LENGTH, MSG.name.tooLong),
    ),
  password: z
    .string()
    .min(1, MSG.password.required)
    .pipe(
      z
        .string()
        .min(PASSWORD_MIN_LENGTH, MSG.password.tooShort)
        .max(PASSWORD_MAX_LENGTH, MSG.password.tooLong)
        .regex(HAS_LETTER, MSG.password.letter)
        .regex(HAS_NUMBER, MSG.password.number)
        .regex(HAS_SPECIAL_CHAR, MSG.password.specialChar),
    ),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, MSG.signInPassword.required),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignUpValues = z.output<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type SignInValues = z.output<typeof signInSchema>;
