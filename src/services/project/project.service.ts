import { prisma } from "@/db";
import type { CreateProjectBody } from "./project.schema";
import { HTTPException } from "hono/http-exception";
import { getStories } from "../story/story.service";

const createProject = async (data: CreateProjectBody, userId: string) => {
  const { name, workgroupId, allocationType, captions, hashtags } = data;
  const project = await prisma.$transaction(async (db) => {
    const workgroupUser = await db.workgroupUser.findFirst({
      where: { workgroupId, userId, User: { role: "CREATOR" } },
    });

    if (!workgroupUser) {
      throw new HTTPException(404, { message: "Workgroup user not found" });
    }

    return db.project.create({
      data: {
        name,
        workgroupId,
        allocationType,
        captions: captions?.split("\n"),
        hashtags,
        workgroupUserId: workgroupUser.id,
      },
    });
  });

  return project;
};

const getProjects = async (workgroupId: string, userId: string) => {
  const projects = await prisma.project.findMany({
    where: { workgroupId, WorkgroupUser: { userId } },
    include: { Story: { orderBy: { id: "asc" } } },
  });
  if (!projects)
    throw new HTTPException(404, { message: "Projects not found" });

  const response = await Promise.all(
    projects.map(async ({ Story, ...item }) => ({
      ...item,
      Story: await getStories(item.id),
    }))
  );

  return response;
};

const deleteProject = (id: string) => {
  return prisma.project.delete({ where: { id } });
};

export { createProject, getProjects, deleteProject };
