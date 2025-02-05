import { minio, prisma } from "@/db";
import type { Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { shuffle } from "lodash";
import { getDownloadUrl, postFileToMinio } from "../storage/storage.service";

const generateContentDistribution = async (projectId: string) => {
  const project = await prisma.project.findUnique({
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
    throw new HTTPException(400, { message: "Not enough stories or session" });

  const {
    Story,
    workgroupId,
    Workgroup: {
      TaskHistory: [{ WorkgroupUserTask }],
      session,
    },
  } = project;

  let storyIndex = 0;
  const map: Map<string, number> = new Map();
  const randomizedStory = shuffle(Story);

  const storyDistribution = WorkgroupUserTask.map((task) => {
    return Array.from({ length: session }).map(
      (_, index): Prisma.ContentDistributionUncheckedCreateInput => {
        const path = `${task.GroupDistribution.code}/${project.name}/${
          index + 1
        }`;

        if (map.has(randomizedStory[storyIndex].id)) {
          const value = map.get(randomizedStory[storyIndex].id);
          map.set(
            randomizedStory[storyIndex].id,
            value! + task.GroupDistribution.amontOfTroops
          );
        } else {
          map.set(
            randomizedStory[storyIndex].id,
            task.GroupDistribution.amontOfTroops
          );
        }

        const data = {
          session: index + 1,
          groupDistributionCode: task.groupDistributionId,
          storyId: randomizedStory[storyIndex].id,
          workgroupId: workgroupId,
          path,
        };
        storyIndex = (storyIndex + 1) % randomizedStory.length;
        return data;
      }
    );
  });

  const payload = storyDistribution.flat();

  const storyTransaction = Array.from(map, ([key, value]) => {
    return prisma.story.update({
      where: { id: key },
      data: { contentPerStory: value },
    });
  });

  const deletePrevContentDistTransaction =
    prisma.contentDistribution.deleteMany({ where: { Story: { projectId } } });

  const contentDistributionTransaction =
    prisma.contentDistribution.createManyAndReturn({
      data: payload,
      skipDuplicates: true,
    });

  const res = await prisma.$transaction([
    deletePrevContentDistTransaction,
    contentDistributionTransaction,
    ...storyTransaction,
  ]);

  return res[1];
};

const postGeneratedContent = async (storyId: string, files: File[]) => {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    include: { ContentDistribution: { include: { GroupDistribution: true } } },
  });
  if (!story) throw new HTTPException(404, { message: "Story not found" });
  if (
    story.contentPerStory !== files.length ||
    story.captions.length < story.contentPerStory
  )
    throw new HTTPException(400, { message: "Not enough files or captions" });
  let offset = 0;
  await Promise.all(
    story.ContentDistribution.map(async (content) => {
      const filesPayload = files.slice(
        offset,
        content.GroupDistribution.amontOfTroops + offset
      );
      const texts = story.captions
        .slice(offset, content.GroupDistribution.amontOfTroops + offset)
        .map((item) => item + " " + story.hashtags);
      const captions = Buffer.from(texts.join("\n"), "utf-8");
      await minio.putObject(
        "generated-content",
        content.path + "/captions.txt",
        captions,
        captions.byteLength,
        {
          "Content-Type": "text/plain",
        }
      );
      offset += content.GroupDistribution.amontOfTroops;
      await Promise.all(
        filesPayload.map((file) =>
          postFileToMinio(file, content.path, "generated-content")
        )
      );
      const file = await getDownloadUrl(content.path);
      return { ...content, file };
    })
  );
  const res = await prisma.$transaction([
    prisma.contentDistribution.findMany({
      where: { Story: { id: storyId } },
    }),
    prisma.story.update({
      where: { id: storyId },
      data: { generatorStatus: "FINISHED" },
    }),
  ]);
  return res[0];
};

export { generateContentDistribution, postGeneratedContent };
