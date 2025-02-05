import { prisma } from "@/db";
import {
  sheetSchema,
  type CreateGroupDistributionBody,
} from "./group-distribution.schema";
import * as xlsx from "xlsx";
import { HTTPException } from "hono/http-exception";
import type { GroupDistribution, WorkgroupUser } from "@prisma/client";
import { shuffle } from "lodash";

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

const getGroupDistributions = (workgroupId: string) => {
  return prisma.groupDistribution.findMany({ where: { workgroupId } });
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

export {
  addGroupDistributions,
  generateTaskDistribution,
  getGroupDistributions,
};
