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

export { generateContentDistributionResponse };
