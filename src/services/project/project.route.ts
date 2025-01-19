import { createRoute } from "@hono/zod-openapi";
import { createProjectBody, createProjectResposne } from "./project.schema";

const createProjectRoute = createRoute({
  tags: ["Project"],
  method: "post",
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

export { createProjectRoute };
