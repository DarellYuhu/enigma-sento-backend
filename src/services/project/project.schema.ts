import { StoryType } from "@prisma/client";
import { z } from "zod";

const createProjectBody = z.object({
  name: z.string().trim().min(1, "Required"),
  workgroupId: z.string().trim().min(1, "Required"),
});

const createProjectResposne = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    status: z.boolean(),
  }),
});

const getProjectsResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      name: z.string(),
      workgroupId: z.string(),
      status: z.boolean(),
      id: z.string(),
      workgroupUserId: z.number(),
      Story: z.array(
        z.object({
          type: z.nativeEnum(StoryType),
          data: z.any(),
          id: z.string(),
          section: z.number().nullable(),
          contentPerStory: z.number().nullable(),
          projectId: z.string(),
          captions: z.array(z.string()),
          hashtags: z.string().nullable(),
        })
      ),
    })
  ),
});

export type CreateProjectBody = z.infer<typeof createProjectBody>;
export { createProjectBody, createProjectResposne, getProjectsResponse };
