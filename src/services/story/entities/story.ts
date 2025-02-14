import { GeneratorStatus, StoryType } from "@prisma/client";
import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const storyZod = z.object({
  section: z.number().optional(),
  data: z
    .array(
      z.object({
        texts: z.array(z.string()),
        textColor: z.string(),
        textBgColor: z.string(),
        textStroke: z.string(),
        textPosition: z.enum(["random", "middle", "bottom"]),
        images: z.array(z.object({ path: z.string(), name: z.string() })),
      })
    )
    .optional(),
  captions: z.array(z.string()).optional(),
  contentPerStory: z.number().optional(),
  generatorStatus: z.nativeEnum(GeneratorStatus).optional(),
  type: z.nativeEnum(StoryType).optional(),
  hashtags: z.string().optional(),
  projectId: z.string(),
});

export type IStory = z.infer<typeof storyZod>;

export const Data = new Schema<NonNullable<IStory["data"]>[0]>({
  images: { type: [{ path: "String", name: "String" }] },
  textBgColor: {},
  textColor: {},
  textPosition: {},
  textStroke: {},
  texts: {},
});

const storySchema = new Schema<IStory>(
  {
    captions: [String],
    contentPerStory: { type: Number },
    data: [Data],
    generatorStatus: { type: "String", default: "NOT_GENERATE" },
    section: {},
    projectId: {},
    hashtags: {},
    type: {},
  },
  { timestamps: true }
);

const Story = mongoose.model("stories", storySchema);

export default Story;
