/**
 * Mirror of backend/src/common/validation/validation-contract.ts.
 * Must stay identical: validation-contract.test.ts fails if the two drift.
 */
export const NAME_MIN_LENGTH = 3;
export const NAME_MAX_LENGTH = 50;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const HAS_LETTER = /[A-Za-z]/;
export const HAS_NUMBER = /\d/;
export const HAS_SPECIAL_CHAR = /[^A-Za-z\d\s]/;

export const VALIDATION_MESSAGES = {
  email: {
    required: "Enter your email address",
    invalid: "Enter a valid email address, like name@example.com",
  },
  name: {
    required: "Enter your name",
    tooShort: `Name must be at least ${NAME_MIN_LENGTH} characters`,
    tooLong: `Name must be ${NAME_MAX_LENGTH} characters or fewer`,
  },
  password: {
    required: "Create a password",
    tooShort: `Use at least ${PASSWORD_MIN_LENGTH} characters`,
    tooLong: `Use ${PASSWORD_MAX_LENGTH} characters or fewer`,
    letter: "Include at least one letter",
    number: "Include at least one number",
    specialChar: "Include at least one special character, like ! @ # or $",
  },
  signInPassword: {
    required: "Enter your password",
  },
  unknownField: "This field isn't allowed",
  summary: "Please check the highlighted fields",
} as const;

export const AUTH_MESSAGES = {
  invalidCredentials: "Email or password is incorrect",
  emailTaken:
    "An account with this email already exists. Try signing in instead.",
  tooManyAttempts: "Too many attempts. Please wait a minute and try again.",
} as const;
