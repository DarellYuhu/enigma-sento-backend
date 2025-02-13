import { minioS3, prisma } from "@/db";
import type { CreateStoryBody, DataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import { getDownloadUrl } from "@/services/storage/storage.service";
import Music from "@/services/asset/entities/music";
import { queue } from "@/lib/generator";

type Data = Omit<CreateStoryBody, "data" | "images"> & {
  data?: DataConfigType1;
  images: File[];
};

const createStory = async ({ data: jsonPayload, images, ...payload }: Data) => {
  const project = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });
  if (!project) throw new HTTPException(404, { message: "Project not found" });
  if (payload.type === "USER_GENERATE")
    return await prisma.story.create({
      data: { ...payload },
    });
  const urls = await Promise.all(
    images!.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${project.name}/assets/${Date.now()}_${file.name}`;
      await minioS3.write(fileName, arrayBuffer, {
        bucket: "images",
        type: file.type,
      });
      // await minio.putObject(
      //   "images",
      //   fileName,
      //   Buffer.from(arrayBuffer),
      //   file.size,
      //   {
      //     "Content-Type": file.type,
      //   }
      // );
      return [file.name, fileName];
    })
  );
  const urlRecord: Record<string, string> = Object.fromEntries(urls);
  const jsonPayloadNormalized = jsonPayload!.map(({ images, ...item }) => ({
    ...item,
    images: images.map((image) => urlRecord[image]),
  }));
  return await prisma.story.create({
    data: { ...payload, data: jsonPayloadNormalized },
  });
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
