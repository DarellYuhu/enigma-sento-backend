import { minio, prisma } from "@/db";
import type { CreateStoryBody, DataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import { config } from "@/config";
import { getDownloadUrl } from "../storage/storage.service";

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
      await minio.putObject(
        "images",
        fileName,
        Buffer.from(arrayBuffer),
        file.size,
        {
          "Content-Type": file.type,
        }
      );
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

const getGeneratedContent = async (storyId: string) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { Project: { select: { name: true } } },
  });

  const basePath = "./tmp/download";

  await Bun.$`./mc alias set myminio http://localhost:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  await Bun.$`./mc cp --recursive myminio/images/${story?.Project.name}/${storyId} ${basePath}/${storyId}`.catch(
    () => {
      throw new HTTPException(404, { message: "Story's contents not found" });
    }
  );
  await Bun.$`tar -czf ${basePath}/${storyId}.tar.gz -C ${basePath} ${storyId}`;

  const fileBuffer = await Bun.file(
    `${basePath}/${storyId}.tar.gz`
  ).arrayBuffer();

  return fileBuffer;
};

const generateContent = async (storyId: string) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { ContentDistribution: { include: { GroupDistribution: true } } },
  });
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (story.type !== "SYSTEM_GENERATE" && !story.data)
    throw new HTTPException(400, {
      message: "This is a system generate story and must have a config in it",
    });
  const sections = story.data as DataConfigType1;
  const config = {
    sections: await Promise.all(
      sections.map(async (item) => ({
        ...item,
        images: await Promise.all(
          item.images.map((imagePath) => getDownloadUrl(imagePath))
        ),
        textPosition: "random",
      }))
    ),
    captions: story.captions,
    hashtags: story.hashtags ?? "",
    sounds: [],
    groupDistribution: story.ContentDistribution.map((item) => ({
      amountOfTroops: item.GroupDistribution.amontOfTroops,
      path: item.path,
    })),
    basePath: `./tmp/${storyId}`,
  };

  await Bun.write(`${config.basePath}/config.json`, JSON.stringify(config));
  await Bun.$`./venv/Scripts/python --version`;
  await Bun.$`./venv/Scripts/python ./scripts/carousels.py ${config.basePath}/config.json`;

  const outputFile = Bun.file(`${config.basePath}/out.json`);
  const { files }: { files: string[] } = await outputFile.json();
  await minio.bucketExists("generated-content").then((exist) => {
    if (!exist) minio.makeBucket("generated-content");
  });

  Promise.all(
    files.map(async (path) => {
      const bunFile = Bun.file(path);
      const arrBuff = await bunFile.arrayBuffer();
      const buff = Buffer.from(arrBuff);
      const fileName = path.replace(config.basePath, "");
      await minio.putObject("generated-content", fileName, buff, bunFile.size, {
        "Content-Type": bunFile.type,
      });
    })
  ).then(() => {
    console.log("Upload finished");
  });
};

export { createStory, updateStory, getGeneratedContent, generateContent };
