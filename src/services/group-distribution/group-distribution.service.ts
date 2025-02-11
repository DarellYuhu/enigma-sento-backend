import { minioS3, prisma } from "@/db";
import {
  sheetSchema,
  type CreateGroupDistributionBody,
} from "./group-distribution.schema";
import * as xlsx from "xlsx";
import { HTTPException } from "hono/http-exception";
import type { GroupDistribution, Project, WorkgroupUser } from "@prisma/client";
import { shuffle } from "lodash";
import { config } from "@/config";
import { format } from "date-fns";
import * as fs from "fs";
xlsx.set_fs(fs);

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
      WorkgroupUser: { where: { User: { role: "CREATOR" }, isDeleted: false } },
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
      },
    },
  });
  const normalized = groupDistributions.map(
    ({ ContentDistribution, ...rest }) => {
      const projects = new Map<string, Project>();
      for (const item of ContentDistribution) {
        if (!projects.has(item.Story.Project.id)) {
          projects.set(item.Story.Project.id, item.Story.Project);
        }
      }

      return {
        ...rest,
        projects: Array.from(projects.values()),
      };
    }
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

  const basePath = `${process.cwd()}/tmp/download`;
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
  const filename = `${groupDistribution.code}_${format(
    new Date(),
    "yyyy-MM-dd"
  )}.tar.gz`;
  const path = `${basePath}/${filename}`;
  await Bun.$`tar -czf ${path} -C ${basePath} ${groupDistribution.code}`;
  const file = Bun.file(`${path}`);
  await minioS3.write(filename, await file.arrayBuffer(), { bucket: "tmp" });
  await Bun.$`rm -rf ${basePath}/`;

  return minioS3.presign(filename, {
    bucket: "tmp",
    method: "GET",
  });
};

const exportGeneratedTask = async (taskId: number) => {
  const {
    Workgroup: _,
    WorkgroupUserTask,
    ...task
  } = await prisma.taskHistory.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      Workgroup: true,
      WorkgroupUserTask: {
        select: {
          WorkgroupUser: { select: { User: true } },
          GroupDistribution: true,
        },
      },
    },
  });

  const map = new Map<string, { name: string; groupDistribution: string[] }>();

  for (const item of WorkgroupUserTask) {
    if (!map.has(item.WorkgroupUser.User.id)) {
      map.set(item.WorkgroupUser.User.id, {
        name: item.WorkgroupUser.User.displayName,
        groupDistribution: [item.GroupDistribution.code],
      });
    } else {
      const { groupDistribution, name } = map.get(item.WorkgroupUser.User.id)!;
      groupDistribution.push(item.GroupDistribution.code);
      map.set(item.WorkgroupUser.User.id, {
        name,
        groupDistribution,
      });
    }
  }
  const worksheet = xlsx.utils.json_to_sheet(
    map
      .values()
      .toArray()
      .map((item) => ({
        ...item,
        groupDistribution: item.groupDistribution.join(", "),
      }))
  );
  const workbook = xlsx.utils.book_new();
  const fileName = `GroupDistributions_${
    task.createdAt.toISOString().split("T")[0]
  }.xlsx`;
  const filePath = `./tmp/${fileName}`;
  xlsx.utils.book_append_sheet(workbook, worksheet);
  xlsx.writeFile(workbook, filePath, { compression: true });

  const fileBuffer = await Bun.file(filePath).arrayBuffer();

  return {
    fileBuffer,
    fileName,
  };
};

export {
  getGeneratedContent,
  exportGeneratedTask,
  addGroupDistributions,
  generateTaskDistribution,
  getGroupDistributions,
};
