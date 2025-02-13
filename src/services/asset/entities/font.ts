import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const fontZod = z.object({
  _id: z.string().optional(),
  path: z.string(),
  name: z.string(),
});

export const createFontPayload = z.object({
  data: z.array(fontZod),
});

const fontSchema = new Schema<IFont>(
  {
    name: { type: "String", required: true, unique: true },
    path: { type: "String", required: true },
  },
  { autoIndex: true }
);

export const Font = mongoose.model<IFont>("fonts", fontSchema);

export type CreateFontPayload = z.infer<typeof createFontPayload>;
export type IFont = z.infer<typeof fontZod>;
