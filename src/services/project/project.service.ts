import { prisma } from "@/db";
import type { CreateProjectBody } from "./project.schema";
import { HTTPException } from "hono/http-exception";
import type { DataConfigType1 } from "../story/story.schema";
import { getDownloadUrl } from "../storage/storage.service";

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
      Story: await Promise.all(
        Story.map(async (storyItem) => ({
          ...storyItem,
          data: storyItem.data
            ? await Promise.all(
                (storyItem.data as DataConfigType1).map(
                  async (dataItem: DataConfigType1["0"]) => ({
                    ...dataItem,
                    images: await Promise.all(
                      dataItem.images.map((image) => getDownloadUrl(image))
                    ),
                  })
                )
              )
            : null,
        }))
      ),
    }))
  );

  return response;
};

const deleteProject = (id: string) => {
  return prisma.project.delete({ where: { id } });
};

export { createProject, getProjects, deleteProject };
