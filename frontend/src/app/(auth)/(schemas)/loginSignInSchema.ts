import { z } from "zod";

export const loginSignInSchema = z.object({
  username: z.string().min(1).max(191),
  password: z.string().min(3).max(191),
  mode: z.enum(["login", "signIn"]),
});
