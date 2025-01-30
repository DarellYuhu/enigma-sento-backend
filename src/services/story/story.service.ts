import { minio, prisma } from "@/db";
import type { CreateStoryBody, DataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import { config } from "@/config";

type Data = Omit<CreateStoryBody, "data" | "images"> & {
  data?: DataConfigType1;
  images: File[];
};

const createStory = async ({ data: jsonPayload, images, ...payload }: Data) => {
  if (payload.type === "DRAFT_ONLY")
    return await prisma.story.create({
      data: { ...payload },
    });
  const urls = await Promise.all(
    images!.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${payload.projectId}/${Date.now()}_${file.name}`;
      await minio.putObject(
        "images",
        fileName,
        Buffer.from(arrayBuffer),
        file.size,
        {
          "Content-Type": file.type,
        }
      );
      return [
        file.name,
        await minio.presignedGetObject("images", fileName, 50000),
      ];
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

const getGeneratedContent = async (storyId: string) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { Project: { select: { name: true } } },
  });

  const basePath = "./tmp/download";

  await Bun.$`./mc alias set myminio http://localhost:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  await Bun.$`./mc cp --recursive myminio/images/${story?.Project.name}/${storyId} ${basePath}/${storyId}`;
  await Bun.$`tar -czf ${basePath}/${storyId}.tar.gz -C ${basePath} ${storyId}`;

  const fileBuffer = await Bun.file(
    `${basePath}/${storyId}.tar.gz`
  ).arrayBuffer();

  return fileBuffer;
};

export { createStory, updateStory, getGeneratedContent };
