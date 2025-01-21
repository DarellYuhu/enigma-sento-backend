import { Role } from "@prisma/client";
import { z } from "zod";

const createWorkgroupUserBody = z.object({
  users: z.array(z.string().trim().min(1)).min(1, "Required"),
});

const createWorkgroupUserResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      id: z.number(),
      userId: z.string(),
      workgroupId: z.string(),
    })
  ),
});

const getWorkgroupUsersResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      workgroupId: z.number(),
      userId: z.string(),
      username: z.string(),
      displayName: z.string(),
      role: z.nativeEnum(Role),
    })
  ),
});

export {
  createWorkgroupUserBody,
  createWorkgroupUserResponse,
  getWorkgroupUsersResponse,
};
