import { prisma } from "@/db";
import type { CreateProjectBody } from "./project.schema";
import { HTTPException } from "hono/http-exception";

const createProject = async (data: CreateProjectBody, userId: string) => {
  const { name, workgroupId } = data;
  const project = await prisma.$transaction(async (db) => {
    const workgroupUser = await db.workgroupUser.findFirst({
      where: { workgroupId, userId, User: { role: "CREATOR" } },
    });

    if (!workgroupUser) {
      throw new HTTPException(404, { message: "Workgroup user not found" });
    }

    return db.project.create({
      data: { name, workgroupId, workgroupUserId: workgroupUser.id },
    });
  });

  return project;
};

const getProjects = (workgroupId: string, userId: string) => {
  return prisma.project.findMany({
    where: { workgroupId, WorkgroupUser: { userId } },
  });
};

export { createProject, getProjects };
