import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";

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
  const workgroup = await prisma.workgroup.findUnique({
    where: { id: workgroupId },
    include: {
      TaskHistory: {
        take: 1,
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

  if (!workgroup)
    throw new HTTPException(404, { message: "Workgroup not found" });
  const { TaskHistory } = workgroup;

  const normalized = TaskHistory.flatMap((task) =>
    task.WorkgroupUserTask.map(
      ({ workgroupUserId, WorkgroupUser, GroupDistribution }) => ({
        workgroupUserId,
        displayName: WorkgroupUser.User.displayName,
        ...GroupDistribution,
      })
    )
  );

  const grouped = normalized.reduce<
    Record<
      number,
      {
        workgroupUserId: number;
        displayName: string;
        distributions: { code: string; amontOfTroops: number }[];
      }
    >
  >((curr, acc) => {
    if (!curr[acc.workgroupUserId]) {
      curr[acc.workgroupUserId] = {
        workgroupUserId: acc.workgroupUserId,
        displayName: acc.displayName,
        distributions: [],
      };
    }
    curr[acc.workgroupUserId].distributions.push({
      code: acc.code,
      amontOfTroops: acc.amontOfTroops,
    });
    return curr;
  }, {});
  return grouped;
};

export {
  createWorkgroup,
  getWorkgroups,
  getWorkgroupUserTasks,
  getWorkgroupById,
};
