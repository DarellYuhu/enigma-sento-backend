import { parseBlob } from "music-metadata";
import { minioS3 } from "@/db";
import Music from "./entities/music";
import { Font, type CreateFontPayload } from "./entities/font";
import { config } from "@/config";
import { HTTPException } from "hono/http-exception";

export const addMusics = async (files: File[]) => {
  await Promise.all(
    files.map(async (file) => {
      const metadata = await parseBlob(file);
      await minioS3.write(`/musics/${file.name}`, file, { bucket: "assets" });
      await Music.create({
        title: file.name.split(".")[0],
        album: metadata.common.album,
        artist: metadata.common.artist,
        createdAt: metadata.format.creationTime,
        duration: metadata.format.duration,
        addedAt: new Date(),
        path: `/musics/${file.name}`,
        size: file.size,
        type: file.type,
        year: metadata.common.year ?? metadata.common.originalyear,
      });
    })
  );
};

export const getAllMusic = async () => {
  const huhi = (await Music.find({}).lean()).map((item) => ({
    ...item,
    path: minioS3.presign(item.path, { bucket: "assets", method: "GET" }),
  }));
  return huhi;
};

export const addFonts = async ({ data }: CreateFontPayload) => {
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  const payload = await Promise.all(
    data.map(async (file) => {
      const target = `assets/all/fonts/${file.name}`;
      await Bun.$`${config.MINIO_CLIENT_COMMAND} mv myminio/tmp/${file.path} myminio/${target}`;
      return { name: file.name, path: target };
    })
  );
  const result = await Font.insertMany(payload).catch((err) => {
    if (err.code === 11000)
      throw new HTTPException(409, { message: "Some font already exists" });
    throw err;
  });
  return result.map(({ name, path, _id }) => ({ name, path, _id }));
};

export const getAllFonts = async () => {
  const fonts = (await Font.find({}).lean()).map((item) => ({
    ...item,
    url: minioS3.presign(item.path, { method: "GET" }),
  }));
  return fonts;
};
