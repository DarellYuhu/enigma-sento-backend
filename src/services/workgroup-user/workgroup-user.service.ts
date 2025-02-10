import { prisma } from "@/db";

const addWorkgroupUser = (ids: string[], workgroupId: string) => {
  return prisma.$transaction(
    ids.map((userId) =>
      prisma.workgroupUser.upsert({
        create: { userId, workgroupId },
        update: { isDeleted: false },
        where: { workgroupId_userId: { userId, workgroupId } },
      })
    )
  );
};

const getWorkgroupUser = async (workgroupId: string) => {
  const workgroups = await prisma.workgroupUser.findMany({
    where: { workgroupId, isDeleted: false },
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
