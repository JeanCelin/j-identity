import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(4),
  email: z.email(),
  password: z.string().min(8),
    clientId: z.string(),
  clientSecret: z.string(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  clientId: z.string(),
  clientSecret: z.string(),
  
});
