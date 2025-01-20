import { createRoute } from "@hono/zod-openapi";
import { createStoryBody, createStoryResponse } from "./story.schema";

const createStoryRoute = createRoute({
  tags: ["Story"],
  method: "post",
  path: "/story",
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

export { createStoryRoute };
