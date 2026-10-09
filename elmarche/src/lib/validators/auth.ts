import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  role: z.enum(["buyer", "seller"]),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});