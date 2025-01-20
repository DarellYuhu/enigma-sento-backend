import { z } from "@hono/zod-openapi";

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const dataConfigType1 = z.object({
  texts: z.array(z.string().trim().min(1, "Required")).min(1),
  textColor: z.string(),
  textPosition: z.enum([
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]),
});

const createStoryBody = z.object({
  section: z
    .string()
    .regex(/^[0-9]+$/i, "Section must be a number")
    .transform(Number)
    .optional(),
  type: z.string(),
  projectId: z.string(),
  data: jsonSchema.openapi({
    type: "object",
    items: {
      type: "object",
      properties: {
        texts: {
          type: "array",
          items: {
            type: "string",
          },
        },
        textColor: {
          type: "string",
        },
        textPosition: {
          type: "string",
        },
      },
    },
  }),
  images: z
    .array(
      z
        .instanceof(File)
        .refine(
          (file) => file.type === "image/jpeg" || file.type === "image/png"
        )
    )
    .min(1)
    .openapi({
      type: "array",
      items: {
        type: "string",
        format: "binary",
      },
    }),
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

export type CreateStoryBody = z.infer<typeof createStoryBody>;
export type DataConfigType1 = z.infer<typeof dataConfigType1>;
export { createStoryBody, createStoryResponse, dataConfigType1 };
