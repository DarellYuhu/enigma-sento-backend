import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";

const createWorkgroup = (data: Prisma.WorkgroupUncheckedCreateInput) => {
  return prisma.workgroup.create({ data });
};

export { createWorkgroup };
