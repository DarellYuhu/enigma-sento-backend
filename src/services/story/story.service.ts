import { minio, prisma } from "@/db";
import type { CreateStoryBody, DataConfigType1 } from "./story.schema";

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

export { createStory };
