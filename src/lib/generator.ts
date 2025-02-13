import { config } from "@/config";
import { minioS3, prisma } from "@/db";
import type { DataConfigType1 } from "@/services/story/story.schema";
import { Queue, Worker, type ConnectionOptions } from "bullmq";

const connection: ConnectionOptions = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
};
export const queue = new Queue("script-queue", {
  connection,
});
export const worker = new Worker<Config & { storyId: string }>(
  "script-queue",
  async (job) => {
    const { storyId, ...data } = job.data;
    await generator(data, storyId);
  },
  { connection }
);

worker.on("stalled", () => {
  console.log("stalled");
});

worker.on("failed", async (job) => {
  const data = job?.data;
  await prisma.story.update({
    where: { id: data?.storyId },
    data: { generatorStatus: "ERROR" },
  });
  await Bun.$`rm -rf ${job?.data.basePath}`;
});

worker.on("error", (err) => {
  console.log(err);
});

async function generator(config: Config, storyId: string) {
  await Bun.write(`${config.basePath}/config.json`, JSON.stringify(config));
  await Bun.$`python --version`;
  await Bun.$`python scripts/carousels.py ${config.basePath}/config.json`;
  console.log('Finished "scripts/carousels.py"');
  const outputFile = Bun.file(`${config.basePath}/out.json`);
  const { files }: { files: string[] } = await outputFile.json();
  await Promise.all(
    files.map(async (path) => {
      const bunFile = Bun.file(path);
      const arrBuff = await bunFile.arrayBuffer();
      const buff = Buffer.from(arrBuff);
      const fileName = path.replace(config.basePath, "");
      await minioS3.delete(fileName, { bucket: "generated-content" });
      await minioS3.write(fileName, buff, {
        bucket: "generated-content",
        type: bunFile.type,
      });
    })
  ).then(() => {
    console.log("Upload finished");
  });
  await prisma.story.update({
    where: { id: storyId },
    data: { generatorStatus: "FINISHED" },
  });
  await Bun.$`rm -rf ${config.basePath}`;
}

type Config = {
  sections: DataConfigType1;
  captions: string[];
  hashtags: string;
  sounds: string[];
  groupDistribution: { amountOfTroops: string; path: string }[];
  basePath: string;
};
