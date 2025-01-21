import { minio, prisma } from "@/db";
import type { CreateStoryBody, DataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";

type Data = Omit<CreateStoryBody, "data"> & { data: DataConfigType1 };

const createStory = async ({ data: jsonPayload, images, ...payload }: Data) => {
  const urls = await Promise.all(
    images.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${Date.now()}_${file.name}`;
      await minio.putObject(
        "images",
        fileName,
        Buffer.from(arrayBuffer),
        file.size,
        {
          "Content-Type": file.type,
        }
      );
      return await minio.presignedGetObject("images", file.name, 50000);
    })
  );
  return await prisma.story.create({
    data: { ...payload, data: { ...jsonPayload, images: urls } },
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

export { createStory, updateStory };
