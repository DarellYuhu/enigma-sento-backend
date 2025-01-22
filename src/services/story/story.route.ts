import { createRoute, z } from "@hono/zod-openapi";
import {
  createStoryBody,
  createStoryResponse,
  updateStoryBody,
} from "./story.schema";

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
  path: "/story/{id}",
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

export { createStoryRoute, updateStoryRoute };
