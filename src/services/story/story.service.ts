import { minioS3, prisma } from "@/db";
import { HTTPException } from "hono/http-exception";
import Music from "@/services/asset/entities/music";
import { queue } from "@/lib/generator";
import type { IStory } from "./entities/story";
import Story from "./entities/story";
import mongoose from "mongoose";
import { config } from "@/config";
import { getAllFonts } from "../asset/asset.service";
import { random } from "lodash";

const createStory = async ({ data, ...payload }: IStory) => {
  await prisma.project.findUniqueOrThrow({ where: { id: payload.projectId } });
  const id = new mongoose.Types.ObjectId();
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  const section = data
    ? await Promise.all(
        data.map(async (item) => {
          const images = await Promise.all(
            item.images.map(async (path) => {
              const newPath = `stories/${id}/${path.name}`;
              await Bun.$`${config.MINIO_CLIENT_COMMAND} mv myminio/tmp/${path.path} myminio/assets/${newPath}`;
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

const updateStory = async (data: Partial<IStory>, id: string) => {
  const story = await Story.findById(id);
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (
    data.captions &&
    data.captions.length < (story.contentPerStory ?? Infinity)
  )
    throw new HTTPException(400, { message: "Not enough captions" });
  return Story.findByIdAndUpdate(id, data, { new: true }).lean();
};

const generateContent = async (storyId: string, withMusic: boolean = false) => {
  const story = await Story.findById(storyId).lean();
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (
    story.type !== "SYSTEM_GENERATE" ||
    !story.data ||
    story.captions?.length! < (story.contentPerStory ?? -1)
  )
    throw new HTTPException(400, {
      message: `You have to provide at least ${story.contentPerStory} captions`,
    });
  await Story.findByIdAndUpdate(storyId, { generatorStatus: "RUNNING" });
  const musicPath = withMusic
    ? (await Music.find({})).map(({ path }) => path)
    : [];
  const sections = story.data;
  const fonts = (await getAllFonts()).map((item) => item.url);
  const ContentDistribution = await prisma.contentDistribution.findMany({
    where: { storyId },
    include: { GroupDistribution: true },
  });
  const config = {
    sections: await Promise.all(
      sections.map(async (item) => ({
        ...item,
        images: await Promise.all(
          item.images.map((imagePath) =>
            minioS3.presign(imagePath.path, {
              bucket: "assets",
              method: "GET",
            })
          )
        ),
      }))
    ),
    font: fonts[random(fonts.length - 1)],
    captions: story.captions,
    hashtags: story.hashtags ?? "",
    sounds: musicPath.map((path) =>
      minioS3.presign(path, { bucket: "assets", method: "GET" })
    ),
    groupDistribution: ContentDistribution.map((item) => ({
      amountOfTroops: item.GroupDistribution.amontOfTroops,
      path: item.path,
    })),
    basePath: `${process.cwd()}/tmp/${storyId}`,
  };

  await Bun.$`mkdir -p ${config.basePath}`;

  await queue.add(storyId, { ...config, storyId });
};

const getStories = async (projectId: string) => {
  const stories = await Story.find({ projectId })
    .sort({ createdAt: "desc" })
    .lean();
  const normalized = stories.map((item) => ({
    ...item,
    data: item.data
      ? item.data.map((item) => ({
          ...item,
          images: item.images.map((image) => ({
            ...image,
            url: minioS3.presign(image.path, {
              bucket: "assets",
              method: "GET",
            }),
          })),
        }))
      : undefined,
  }));
  return normalized;
};

const deleteStory = async (id: string) => {
  await Story.deleteOne({ _id: id });
  return await prisma.story.delete({ where: { id } });
};

const updateSection = async (
  storyId: string,
  sectionId: string,
  data: Partial<
    NonNullable<IStory["data"]>["0"] & {
      newImages: { path: string; name: string }[];
      deletedImages: { path: string; name: string; _id: string }[];
    }
  >
) => {
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  if (data.deletedImages) {
    await Promise.all(
      data.deletedImages.map(async (image) => {
        await minioS3.delete(image.path, { bucket: "assets" });
      })
    );
  }
  console.log("huhi");
  if (data.newImages) {
    const newImages = await Promise.all(
      data.newImages.map(async (path) => {
        const newPath = `stories/${storyId}/${path.name}`;
        await Bun.$`${config.MINIO_CLIENT_COMMAND} mv myminio/tmp/${path.path} myminio/assets/${newPath}`;
        return { path: newPath, name: path.name };
      })
    );
    if (!data.images) data.images = [];
    data.images.push(...newImages);
  }

  const updates = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [`data.$.${key}`, value])
  );

  const section = await Story.findOneAndUpdate(
    { _id: storyId, "data._id": sectionId },
    { $set: updates },
    { new: true }
  );
  return section;
};

export {
  createStory,
  deleteStory,
  updateStory,
  generateContent,
  getStories,
  updateSection,
};
