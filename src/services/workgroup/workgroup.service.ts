import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { getWorkgroupUserTasksResponse } from "./workgroup.schema";

const createWorkgroup = (data: Prisma.WorkgroupUncheckedCreateInput) => {
  return prisma.workgroup.create({ data });
};

const getWorkgroups = (userId: string) => {
  return prisma.workgroup.findMany({
    where: {
      OR: [
        { Manager: { id: userId } },
        { WorkgroupUser: { some: { userId } } },
      ],
    },
  });
};

const getWorkgroupById = (workgroupId: string) =>
  prisma.workgroup.findUnique({ where: { id: workgroupId } });

const getWorkgroupUserTasks = async (workgroupId: string) => {
  const { TaskHistory } = await prisma.workgroup.findUniqueOrThrow({
    where: { id: workgroupId },
    include: {
      TaskHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          WorkgroupUserTask: {
            include: {
              GroupDistribution: true,
              WorkgroupUser: {
                select: { User: { select: { displayName: true } }, id: true },
              },
            },
          },
        },
      },
    },
  });

  const normalized = TaskHistory.map(({ WorkgroupUserTask, ...rest }) => {
    const map = new Map<number, Distributions["0"]>();
    for (const {
      WorkgroupUser,
      GroupDistribution,
      workgroupUserId,
    } of WorkgroupUserTask) {
      if (!map.has(WorkgroupUser.id)) {
        map.set(WorkgroupUser.id, {
          displayName: WorkgroupUser.User.displayName,
          workgroupUserId: workgroupUserId,
          distributions: [
            {
              code: GroupDistribution.code,
              amontOfTroops: GroupDistribution.amontOfTroops,
            },
          ],
        });
      } else {
        const { distributions, ...rest } = map.get(workgroupUserId)!;
        map.set(workgroupUserId, {
          ...rest,
          distributions: [
            ...distributions,
            {
              code: GroupDistribution.code,
              amontOfTroops: GroupDistribution.amontOfTroops,
            },
          ],
        });
      }
    }
    return [
      rest.id,
      {
        ...rest,
        users: Array.from(map.values()),
      },
    ];
  });

  return Object.fromEntries(normalized);
};

const deleteWorkgroupUser = (workgroupId: string, userId: string) => {
  return prisma.workgroupUser.update({
    where: { workgroupId_userId: { workgroupId, userId } },
    data: { isDeleted: true },
  });
};

type Distributions = z.infer<
  typeof getWorkgroupUserTasksResponse
>["data"]["0"]["users"];

export {
  createWorkgroup,
  getWorkgroups,
  getWorkgroupUserTasks,
  getWorkgroupById,
  deleteWorkgroupUser,
};
