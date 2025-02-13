import { minioS3, prisma } from "@/db";
import type { DataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import { getDownloadUrl } from "@/services/storage/storage.service";
import Music from "@/services/asset/entities/music";
import { queue } from "@/lib/generator";
import type { IStory } from "./entities/story";
import Story from "./entities/story";
import mongoose from "mongoose";
import { config } from "@/config";

const createStory = async ({ data, ...payload }: IStory) => {
  await prisma.project.findUniqueOrThrow({ where: { id: payload.projectId } });
  const id = new mongoose.Types.ObjectId();
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  const section = data
    ? await Promise.all(
        data.map(async (item) => {
          const images = await Promise.all(
            item.images.map(async (path) => {
              const newPath = `assets/stories/${id}/${path.name}`;
              await Bun.$`${config.MINIO_CLIENT_COMMAND} mv myminio/tmp/${path.path} myminio/${newPath}`;
              return { path: newPath, name: path.name };
            })
          );
          return { ...item, images };
        })
      )
    : undefined;
  const doc = new Story({ _id: id, ...payload, data: section });
  const result = await doc.save();
  await prisma.story.create({
    data: { id: result._id.toString(), projectId: payload.projectId },
  });
  return await Story.findById(result._id).lean();
};

type UpdateStoryBody = {
  captions: string[];
  hashtags: string;
};
const updateStory = async (data: Partial<UpdateStoryBody>, id: string) => {
  const story = await prisma.story.findUnique({
    where: { id },
    select: { contentPerStory: true },
  });
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (
    data.captions &&
    data.captions.length < (story.contentPerStory ?? Infinity)
  )
    throw new HTTPException(400, { message: "Not enough captions" });
  return prisma.story.update({ where: { id }, data });
};

const generateContent = async (storyId: string, withMusic: boolean = false) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { ContentDistribution: { include: { GroupDistribution: true } } },
  });
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  // if (story.generatorStatus === "RUNNING")
  //   throw new HTTPException(400, { message: "Story is being generated" });
  if (
    story.type !== "SYSTEM_GENERATE" ||
    !story.data ||
    story.captions.length < (story.contentPerStory ?? -1)
  )
    throw new HTTPException(400, {
      message: `You have to provide at least ${story.contentPerStory} captions`,
    });
  await prisma.story.update({
    where: { id: storyId },
    data: { generatorStatus: "RUNNING" },
  });
  const musicPath = withMusic
    ? (await Music.find({})).map(({ path }) => path)
    : [];
  const sections = story.data as DataConfigType1;
  const config = {
    sections: await Promise.all(
      sections.map(async (item) => ({
        ...item,
        images: await Promise.all(
          item.images.map((imagePath) => getDownloadUrl(imagePath))
        ),
      }))
    ),
    captions: story.captions,
    hashtags: story.hashtags ?? "",
    sounds: musicPath.map((path) =>
      minioS3.presign(path, { bucket: "assets", method: "GET" })
    ),
    groupDistribution: story.ContentDistribution.map((item) => ({
      amountOfTroops: item.GroupDistribution.amontOfTroops,
      path: item.path,
    })),
    basePath: `${process.cwd()}/tmp/${storyId}`,
  };

  await Bun.$`mkdir -p ${config.basePath}`;

  await queue.add(storyId, { ...config, storyId });
};

const deleteStory = (id: string) => {
  return prisma.story.delete({ where: { id } });
};

export { createStory, deleteStory, updateStory, generateContent };
