import { z } from "zod";

const createWorkgroupBody = z.object({
  name: z.string().trim().min(1, "Required"),
  session: z.number().min(1, "Required"),
  projectStoryPerUser: z.number().min(1, "Required"),
});

const createWorkgroupResponse = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    session: z.number(),
    projectStoryPerUser: z.number(),
  }),
});
export { createWorkgroupBody, createWorkgroupResponse };
