import mongoose, { Schema } from "mongoose";
import { z } from "zod";

export const musicZod = z.object({
  _id: z.string(),
  title: z.string(),
  path: z.string(),
  type: z.string(),
  size: z.number(),
  duration: z.number(),
  album: z.string().optional(),
  artist: z.string().optional(),
  year: z.number().optional(),
  createdAt: z.date().optional(),
  addedAt: z.date(),
});

type IMusic = z.infer<typeof musicZod>;

const musicSchema = new Schema<IMusic>({
  title: { type: "String", required: true },
  path: { type: "String", required: true },
  type: { type: "String", required: true },
  size: { type: "Number", required: true },
  duration: { type: "Number", required: true },
  album: { type: "String", required: false },
  artist: { type: "String", required: false },
  year: { type: "Number", required: false },
  createdAt: { type: "Date", required: false },
  addedAt: { type: "Date", required: true },
});

const Music = mongoose.model<IMusic>("Music", musicSchema);

export default Music;
