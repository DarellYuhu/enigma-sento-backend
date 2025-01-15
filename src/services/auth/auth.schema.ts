import { z } from "@hono/zod-openapi";

const signInBody = z.object({
  username: z.string().trim().min(1, "Required"),
  password: z.string().trim().min(1, "Required"),
});

const signInResponse = z.object({
  message: z.string(),
  data: z.object({
    token: z.string(),
    user: z.object({
      id: z.string(),
      displayName: z.string(),
      role: z.string(),
    }),
  }),
});

export type SignInSchema = z.infer<typeof signInBody>;

export { signInBody, signInResponse };
