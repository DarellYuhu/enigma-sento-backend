import { z } from "zod";

const createProjectBody = z.object({
  name: z.string().trim().min(1, "Required"),
  workgroupId: z.string().trim().min(1, "Required"),
  userId: z.string().trim().min(1, "Required"),
});

const createProjectResposne = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    status: z.boolean(),
  }),
});

export type CreateProjectBody = z.infer<typeof createProjectBody>;
export { createProjectBody, createProjectResposne };
