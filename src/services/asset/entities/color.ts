import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const colorZod = z.object({
  _id: z.string().optional(),
  primary: z.string(),
  secondary: z.string(),
});

type IColor = z.infer<typeof colorZod>;
const colorSchema = new Schema<IColor>({
  primary: String,
  secondary: String,
});

export const Color = mongoose.model("colors", colorSchema);
