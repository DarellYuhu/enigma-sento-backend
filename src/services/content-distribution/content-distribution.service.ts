import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { shuffle } from "lodash";

const generateContentDistribution = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      Story: true,
      Workgroup: {
        select: {
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
    throw new HTTPException(404, { message: "Project not found" });
  }
  if (project.Story.length < project.Workgroup.session)
    throw new HTTPException(400, { message: "Not enough stories" });

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
        const path = `${task.groupDistributionId}/${index + 1}`;

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

  const contentDistributionTransaction =
    prisma.contentDistribution.createManyAndReturn({
      data: payload,
      skipDuplicates: true,
    });

  const res = await prisma.$transaction([
    contentDistributionTransaction,
    ...storyTransaction,
  ]);

  return res[0];
};

export { generateContentDistribution };
