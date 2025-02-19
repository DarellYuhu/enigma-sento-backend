import { minioS3, prisma } from "@/db";
import type { Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { shuffle } from "lodash";
import { config } from "@/config";
import Story from "../story/entities/story";

const generateContentDistribution = async (projectId: string) => {
  const project = await prisma.project.findFirstOrThrow({
    where: { id: projectId },
    include: {
      Story: true,
      Workgroup: {
        select: {
          projectStoryPerUser: true,
          session: true,
          TaskHistory: {
            select: {
              WorkgroupUserTask: {
                include: { GroupDistribution: true },
                where: {
                  WorkgroupUser: { Project: { some: { id: projectId } } },
                },
              },
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!project) {
    throw new HTTPException(404, { message: "Project or workgroup not found" });
  }
  if (
    project.Story.length < project.Workgroup.session ||
    project.Story.length < project.Workgroup.projectStoryPerUser
  )
    throw new HTTPException(400, {
      message: `Not enough stories. You need at least ${project.Workgroup.projectStoryPerUser} stories`,
    });

  const {
    Story: prismaStory,
    workgroupId,
    Workgroup: {
      TaskHistory: [{ WorkgroupUserTask }],
      session,
    },
  } = project;

  let storyIndex = 0;
  const map: Map<string, number> = new Map();
  const randomizedStory = shuffle(prismaStory);

  const storyDistribution = await Promise.all(
    WorkgroupUserTask.map(
      async ({
        GroupDistribution: { amontOfTroops, code },
        groupDistributionId,
      }) => {
        return await Promise.all(
          Array.from({ length: session }).map(
            async (
              _,
              index
            ): Promise<Prisma.ContentDistributionUncheckedCreateInput> => {
              const path = `${code}/${project.name}/${index + 1}`;

              if (project.allocationType === "GENERIC") {
                const amountOfContents = Math.floor(
                  amontOfTroops / randomizedStory.length
                );
                const modulo = amontOfTroops % randomizedStory.length;
                let offset = 0;
                const payload = randomizedStory.map(({ id: storyId }) => {
                  const data = {
                    amountOfContents,
                    offset,
                    storyId,
                  };
                  offset += amountOfContents;
                  return data;
                });
                if (modulo > 0) {
                  Array.from({ length: modulo }).forEach(
                    (_, idx) => (payload[idx].amountOfContents += 1)
                  );
                }
                payload.forEach((item) => {
                  if (map.has(item.storyId)) {
                    const value = map.get(item.storyId);
                    map.set(item.storyId, value! + item.amountOfContents);
                  } else {
                    map.set(item.storyId, item.amountOfContents);
                  }
                });
                const texts = project.captions?.map(
                  (item) => item + " " + project.hashtags
                );
                offset += amountOfContents;
                const captions = Buffer.from(texts.join("\n"), "utf-8");
                await minioS3.write(`${path}/captions.txt`, captions, {
                  type: "text/plain",
                  bucket: "generated-content",
                });
                return {
                  session: index + 1,
                  groupDistributionCode: groupDistributionId,
                  workgroupId: workgroupId,
                  path,
                  DistributionStory: {
                    createMany: { data: payload },
                  },
                };
              }

              if (map.has(randomizedStory[storyIndex].id)) {
                const value = map.get(randomizedStory[storyIndex].id);
                map.set(randomizedStory[storyIndex].id, value! + amontOfTroops);
              } else {
                map.set(randomizedStory[storyIndex].id, amontOfTroops);
              }

              const data = {
                session: index + 1,
                groupDistributionCode: groupDistributionId,
                storyId: randomizedStory[storyIndex].id,
                workgroupId: workgroupId,
                path,
              };
              storyIndex = (storyIndex + 1) % randomizedStory.length;
              return data;
            }
          )
        );
      }
    )
  );

  const payload = storyDistribution.flat();

  await Promise.all(
    Array.from(map, ([key, value]) => {
      return Story.updateOne(
        {
          _id: key,
        },
        { contentPerStory: value }
      );
    })
  );

  const contentDistributionTransaction = payload.map((item) =>
    prisma.contentDistribution.create({ data: item })
  );

  const updateProjectStatus = prisma.project.update({
    where: { id: projectId },
    data: { status: true },
  });

  await prisma.$transaction([
    ...contentDistributionTransaction,
    updateProjectStatus,
  ]);
};

const postGeneratedContent = async (storyId: string, files: string[]) => {
  const story = await Story.findById(storyId).lean();
  const project = await prisma.project.findFirstOrThrow({
    where: { Story: { some: { id: storyId } } },
  });
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (
    (story.contentPerStory !== files.length ||
      story.captions?.length! < story.contentPerStory) &&
    project.allocationType === "SPECIFIC"
  )
    throw new HTTPException(400, { message: "Not enough files or captions" });
  let offset = 0;
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;
  const ContentDistribution = await prisma.contentDistribution.findMany({
    where: { OR: [{ DistributionStory: { some: { storyId } } }, { storyId }] },
    include: { GroupDistribution: true, DistributionStory: true },
  });
  await Promise.all(
    ContentDistribution.map(async (content) => {
      const amountOfContents =
        content.DistributionStory.find((item) => item.storyId === storyId)
          ?.amountOfContents ?? content.GroupDistribution.amontOfTroops;

      const path =
        project.allocationType === "GENERIC"
          ? `${content.path}/UG`
          : content.path;
      const filesPayload = files.slice(offset, amountOfContents + offset);
      const texts = story
        .captions!.slice(offset, amountOfContents + offset)
        .map((item) => item + " " + story.hashtags);
      offset += amountOfContents;
      const captions = Buffer.from(texts.join("\n"), "utf-8");
      await minioS3.write(`${path}/captions.txt`, captions, {
        type: "text/plain",
        bucket: "generated-content",
      });
      await Bun.$`${config.MINIO_CLIENT_COMMAND} rm --recursive --force myminio/generated-content/${path}`;
      await Promise.all(
        filesPayload.map(
          async (file) =>
            await Bun.$`${config.MINIO_CLIENT_COMMAND} mv "myminio/tmp/${file}" "myminio/generated-content/${path}/${file}"`
        )
      );
    })
  );
  const res = await Story.findByIdAndUpdate(storyId, {
    generatorStatus: "FINISHED",
  }).lean();
  return res;
};

export { generateContentDistribution, postGeneratedContent };
