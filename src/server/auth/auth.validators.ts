import { z } from "zod";

/**
 * Credential shapes for the account card. Messages carry dictionary keys, not
 * prose — see lib/translate-error.ts.
 *
 * Both schemas declare `name` so the two modes share one form type; sign-in
 * simply does not constrain it.
 */
export const MIN_PASSWORD_LENGTH = 8;

const credentials = {
  email: z.email({ message: "invalidEmail" }),
  password: z.string().min(MIN_PASSWORD_LENGTH, { message: "shortPassword" }),
};

export const signInInputSchema = z.object({
  ...credentials,
  name: z.string(),
});

export const signUpInputSchema = z.object({
  ...credentials,
  name: z.string().trim().min(2, { message: "tooShort:2" }).max(120, { message: "tooLong:120" }),
});

export type AuthFormInput = z.infer<typeof signUpInputSchema>;
