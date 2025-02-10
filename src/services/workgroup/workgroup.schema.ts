import { z } from "zod";

const createWorkgroupBody = z.object({
  name: z.string().trim().min(1, "Required"),
  session: z.number().min(1, "Required"),
  projectStoryPerUser: z.number().min(1, "Required"),
});

const createWorkgroupResponse = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    session: z.number(),
    projectStoryPerUser: z.number(),
  }),
});

const getWorkgroupsResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      name: z.string(),
      session: z.number(),
      projectStoryPerUser: z.number(),
      id: z.string(),
      managerId: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  ),
});

const getWorkgroupUserTasksResponse = z.object({
  message: z.string(),
  data: z.record(
    z.number(),
    z.object({
      id: z.number(),
      createdAt: z.date(),
      workgroupId: z.string(),
      users: z.record(
        z.number(),
        z.object({
          workgroupUserId: z.number(),
          displayName: z.string(),
          distributions: z.array(
            z.object({
              code: z.string(),
              amontOfTroops: z.number(),
            })
          ),
        })
      ),
    })
  ),
});

export {
  createWorkgroupBody,
  createWorkgroupResponse,
  getWorkgroupsResponse,
  getWorkgroupUserTasksResponse,
};
