import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";

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

export { createWorkgroup, getWorkgroups };
