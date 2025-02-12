import { createRoute, z } from "@hono/zod-openapi";

export const getUploadUrlRoute = createRoute({
  method: "get",
  path: "/storage/upload",
  request: {
    query: z.object({
      path: z.string(),
    }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({ message: z.string(), data: z.string() }),
        },
      },
    },
  },
});
