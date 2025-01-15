import { createRoute, z } from "@hono/zod-openapi";
import {
  createWorkgroupUserBody,
  createWorkgroupUserResponse,
} from "./workgroup-user.schema";
import { jwt } from "hono/jwt";
import { config } from "@/config";

const createWorkgroupUserRoute = createRoute({
  tags: ["Workgroup User"],
  method: "post",
  path: "/workgroup/{id}/users",
  summary: "Add users to workgroup",
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: createWorkgroupUserBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      content: {
        "application/json": {
          schema: createWorkgroupUserResponse,
        },
      },
    },
  },
});

export { createWorkgroupUserRoute };
