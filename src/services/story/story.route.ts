import { createRoute, z } from "@hono/zod-openapi";
import {
  createStoryBody,
  createStoryResponse,
  updateStoryBody,
} from "./story.schema";
import { rbacMiddleware } from "@/middlewares/rbacMiddleware";
import { config } from "@/config";
import { jwt } from "hono/jwt";

const createStoryRoute = createRoute({
  tags: ["Story"],
  method: "post",
  path: "/stories",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createStoryBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "CREATED",
      content: {
        "application/json": {
          schema: createStoryResponse,
        },
      },
    },
  },
});

const updateStoryRoute = createRoute({
  tags: ["Story"],
  method: "patch",
  path: "/stories/{id}",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: updateStoryBody,
        },
      },
    },
  },

  responses: {
    200: {
      description: "UPDATED",
      content: {
        "application/json": {
          schema: createStoryResponse,
        },
      },
    },
  },
});

const generateContentRoute = createRoute({
  method: "patch",
  path: "/stories/{id}/contents",
  request: {
    params: z.object({ id: z.string() }),
    query: z.object({
      withMusic: z.preprocess((val) => val === "true", z.boolean()),
    }),
  },
  responses: {
    200: {
      description: "OK",
    },
  },
});

const deleteStoryRoute = createRoute({
  tags: ["Story"],
  method: "delete",
  path: "/stories/{id}",
  summary: "Delete story",
  request: {
    params: z.object({ id: z.string() }),
  },
  middleware: [
    jwt({ secret: config.JWT_SECRET }),
    rbacMiddleware(["CREATOR"]),
  ] as const,
  responses: {
    204: {
      description: "NO CONTENT",
    },
  },
});

export {
  createStoryRoute,
  updateStoryRoute,
  generateContentRoute,
  deleteStoryRoute,
};
