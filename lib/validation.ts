import { z } from 'zod';

export const SignupSchema = z.object({
  displayName: z.string().min(2).max(40).trim(),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  username: z.string()
    .min(3).max(20)
    .toLowerCase()
    .regex(/^[a-z0-9_]+$/, 'Username can only contain letters, numbers, underscores'),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const PollSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty').max(150).trim(),
  options: z
    .array(z.string().min(1).max(60).trim())
    .min(2, 'At least 2 options required')
    .max(4, 'Maximum 4 options allowed'),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PollInput = z.infer<typeof PollSchema>;