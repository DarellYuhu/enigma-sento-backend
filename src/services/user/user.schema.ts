import { z } from "zod";

const createUserBody = z.object({
  displayName: z.string().trim().min(1, "Required"),
  username: z.string().trim().min(1, "Required"),
  password: z.string().trim().min(1, "Required"),
  role: z.enum(["MANAGER", "CREATOR", "DISTRIBUTOR"]),
});

const createUserResponse = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    displayName: z.string(),
    username: z.string(),
    role: z.string(),
  }),
});

export type CreateUserSchema = z.infer<typeof createUserBody>;
export { createUserBody, createUserResponse };
