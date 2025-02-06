import { prisma } from "@/db";
import {
  sheetSchema,
  type CreateGroupDistributionBody,
} from "./group-distribution.schema";
import * as xlsx from "xlsx";
import { HTTPException } from "hono/http-exception";
import type { GroupDistribution, WorkgroupUser } from "@prisma/client";
import { shuffle } from "lodash";
import { config } from "@/config";
import { format } from "date-fns";

const addGroupDistributions = async (
  data: CreateGroupDistributionBody,
  workgroupId: string
) => {
  const buffer = await data.file.arrayBuffer();
  const workbook = xlsx.read(buffer, { type: "array" });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const parsed = xlsx.utils.sheet_to_json(worksheet);
  const valid = sheetSchema.parse(parsed);
  return prisma.groupDistribution.createManyAndReturn({
    data: valid.map((item) => ({ ...item, workgroupId })),
  });
};

const generateTaskDistribution = async (workgroupId: string) => {
  const workgroup = await prisma.workgroup.findUnique({
    where: { id: workgroupId },
    include: {
      DistributionGroup: true,
      WorkgroupUser: { where: { User: { role: "CREATOR" } } },
    },
  });
  if (!workgroup) {
    throw new HTTPException(404, { message: "Workgroup not found" });
  }
  const distributed = distributeGroupDistribution(
    workgroup.WorkgroupUser,
    workgroup.DistributionGroup
  );

  return await prisma.taskHistory.create({
    data: {
      workgroupId,
      WorkgroupUserTask: {
        createMany: { data: distributed },
      },
    },
  });
};

const getGroupDistributions = async (workgroupId: string) => {
  const groupDistributions = await prisma.groupDistribution.findMany({
    where: { workgroupId },
    include: {
      ContentDistribution: {
        select: { Story: { select: { Project: true } } },
        distinct: ["storyId"],
      },
    },
  });
  const normalized = groupDistributions.map(
    ({ ContentDistribution, ...rest }) => ({
      ...rest,
      projects: ContentDistribution.map((item) => item.Story.Project),
    })
  );
  return normalized;
};

const distributeGroupDistribution = (
  users: WorkgroupUser[],
  tasks: GroupDistribution[]
) => {
  const result: { workgroupUserId: number; groupDistributionId: string }[] = [];
  const randomizedUsers = shuffle(users);
  let userIndex = 0;

  for (const task of tasks) {
    const user = randomizedUsers[userIndex];
    result.push({ workgroupUserId: user.id, groupDistributionId: task.id });
    userIndex = (userIndex + 1) % randomizedUsers.length;
  }

  return result;
};

const getGeneratedContent = async (id: string, projectIds: string[]) => {
  const groupDistribution = await prisma.groupDistribution.findUnique({
    where: { id },
    include: {
      Workgroup: { select: { Project: { where: { id: { in: projectIds } } } } },
    },
  });

  if (!groupDistribution)
    throw new HTTPException(404, { message: "Group distribution not found" });

  const basePath = "./tmp/download";
  await Bun.$`${config.MINIO_CLIENT_COMMAND} alias set myminio http://${config.MINIO_HOST}:${config.MINIO_PORT} ${config.MINIO_ACCESS_KEY} ${config.MINIO_SECRET_KEY}`;

  await Promise.all(
    groupDistribution.Workgroup.Project.map(async ({ name }) => {
      await Bun.$`${config.MINIO_CLIENT_COMMAND} cp --recursive myminio/generated-content/${groupDistribution.code}/${name} ${basePath}/${groupDistribution.code}`.catch(
        () => {
          throw new HTTPException(404, {
            message: "Story's contents not found",
          });
        }
      );
    })
  );
  await Bun.$`tar -czf ${basePath}/${groupDistribution.code}.tar.gz -C ${basePath} ${groupDistribution.code}`;

  const fileBuffer = await Bun.file(
    `${basePath}/${groupDistribution.code}.tar.gz`
  ).arrayBuffer();

  return {
    fileBuffer,
    fileName: `${groupDistribution.code}_${format(
      new Date(),
      "yyyy-MM-dd"
    )}.tar.gz`,
  };
};

export {
  getGeneratedContent,
  addGroupDistributions,
  generateTaskDistribution,
  getGroupDistributions,
};
