import { prisma } from "@/db";
import type { CreateProjectBody } from "./project.schema";
import { HTTPException } from "hono/http-exception";

const createProject = async (data: CreateProjectBody) => {
  const { name, userId, workgroupId } = data;
  const project = await prisma.$transaction(async (db) => {
    const workgroupUser = await db.workgroupUser.findFirst({
      where: { workgroupId, userId },
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

export { createProject };
