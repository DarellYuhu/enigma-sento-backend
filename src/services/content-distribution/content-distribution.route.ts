import { createRoute, z } from "@hono/zod-openapi";
import { generateContentDistributionResponse } from "./content-distribution.schema";

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

export { generateContentDistributionRoute };
