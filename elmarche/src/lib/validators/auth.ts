import { z } from "zod";
import { isValidWilayaCode } from "@/lib/constants/wilayas";
import { normalizePhone } from "@/lib/phone";

const baseSignup = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  wilaya: z.coerce.number().int().refine(isValidWilayaCode),
});

const whatsappSchema = z
  .string()
  .refine((value) => normalizePhone(value) !== null)
  .transform((value) => normalizePhone(value) as string);

export const signupSchema = z.discriminatedUnion("role", [
  baseSignup.extend({ role: z.literal("buyer") }),
  baseSignup.extend({
    role: z.literal("seller"),
    shopName: z.string().trim().min(2).max(80),
    whatsapp: whatsappSchema,
  }),
]);

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});