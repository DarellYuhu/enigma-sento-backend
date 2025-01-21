import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";

const addWorkgroupUser = (ids: string[], workgroupId: string) => {
  const data: Prisma.WorkgroupUserCreateManyInput[] = ids.map((id) => ({
    userId: id,
    workgroupId,
  }));
  return prisma.workgroupUser.createManyAndReturn({ data });
};

const getWorkgroupUser = async (workgroupId: string) => {
  const workgroups = await prisma.workgroupUser.findMany({
    where: { workgroupId },
    include: {
      User: { select: { username: true, role: true, displayName: true } },
    },
  });

  return workgroups.map((workgroup) => ({
    workgroupId: workgroup.id,
    userId: workgroup.userId,
    username: workgroup.User.username,
    role: workgroup.User.role,
    displayName: workgroup.User.displayName,
  }));
};

export { addWorkgroupUser, getWorkgroupUser };
