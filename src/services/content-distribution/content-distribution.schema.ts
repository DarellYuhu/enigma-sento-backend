import { z } from "zod";

const generateContentDistributionResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      path: z.string(),
      session: z.number(),
      workgroupId: z.string(),
      groupDistributionCode: z.string(),
      storyId: z.string(),
    })
  ),
});

const postGeneratedContentBody = z.object({
  storyId: z.string().trim().min(1, "Required"),
  files: z.array(z.string()).min(1, "Required"),
});

export { generateContentDistributionResponse, postGeneratedContentBody };
