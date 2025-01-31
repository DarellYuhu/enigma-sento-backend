import { z } from "@hono/zod-openapi";
import { StoryType } from "@prisma/client";

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const dataConfigType1 = z.array(
  z.object({
    texts: z.array(z.string()),
    textColor: z.string(),
    textPosition: z.enum(["random", "middle", "bottom"]),
    images: z.array(z.string()),
  })
);

const createStoryBody = z.object({
  images: z.union([z.array(z.instanceof(File)), z.instanceof(File)]).optional(),
  data: jsonSchema
    .openapi({
      type: "array",
      items: {
        type: "object",
      },
    })
    .optional(),
  type: z.nativeEnum(StoryType),
  projectId: z.string(),
  section: z.preprocess((val) => Number(val), z.number().positive()).optional(),
});

const createStoryResponse = z.object({
  message: z.string(),
  data: z.object({
    type: z.string(),
    id: z.string(),
    section: z.number().nullable(),
    contentPerStory: z.number().nullable(),
    projectId: z.string(),
    captions: z.array(z.string()).nullable(),
    hashtags: z.string().nullable(),
  }),
});

const updateStoryBody = z.object({
  captions: z.array(z.string()).optional(),
  hashtags: z.string().optional(),
});
export type CreateStoryBody = z.infer<typeof createStoryBody>;
export type DataConfigType1 = z.infer<typeof dataConfigType1>;
export {
  createStoryBody,
  createStoryResponse,
  dataConfigType1,
  updateStoryBody,
};
