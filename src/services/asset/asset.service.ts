import { parseBlob } from "music-metadata";
import { minioS3 } from "@/db";
import Music from "./entities/music";

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
