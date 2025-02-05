import mongoose, { Schema } from "mongoose";

interface IMusic {
  title: string;
  path: string;
  type: string;
  size: number;
  duration: number;
  album: string;
  artist: string;
  year: number;
  createdAt: Date;
  addedAt: Date;
}

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
