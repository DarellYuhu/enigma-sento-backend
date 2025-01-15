import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";

const addWorkgroupUser = (ids: string[], workgroupId: string) => {
  const data: Prisma.WorkgroupUserCreateManyInput[] = ids.map((id) => ({
    userId: id,
    workgroupId,
  }));
  return prisma.workgroupUser.createManyAndReturn({ data });
};

export { addWorkgroupUser };
