import { createRoute, z } from "@hono/zod-openapi";
import {
  generateContentDistributionResponse,
  postGeneratedContentBody,
} from "./content-distribution.schema";

const generateContentDistributionRoute = createRoute({
  method: "post",
  path: "/project/{id}/content-distribution",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "GENERATED",
      content: {
        "application/json": {
          schema: generateContentDistributionResponse,
        },
      },
    },
  },
});

const postGeneratedContentRoute = createRoute({
  method: "post",
  path: "/stories/{id}/content-distribution",
  request: {
    body: {
      content: { "multipart/form-data": { schema: postGeneratedContentBody } },
    },
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": { schema: generateContentDistributionResponse },
      },
    },
  },
});

export { generateContentDistributionRoute, postGeneratedContentRoute };
