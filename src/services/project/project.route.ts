import { createRoute } from "@hono/zod-openapi";
import {
  createProjectBody,
  createProjectResposne,
  getProjectsResponse,
} from "./project.schema";
import { jwt } from "hono/jwt";
import { config } from "@/config";

const createProjectRoute = createRoute({
  tags: ["Project"],
  method: "post",
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  path: "/projects",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createProjectBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      content: {
        "application/json": {
          schema: createProjectResposne,
        },
      },
    },
  },
});

const getProjectsRoute = createRoute({
  method: "get",
  path: "/workgroups/{workgroupId}/projects",
  middleware: [jwt({ secret: config.JWT_SECRET })] as const,
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: getProjectsResponse,
        },
      },
    },
  },
});
export { createProjectRoute, getProjectsRoute };
