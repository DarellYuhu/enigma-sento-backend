import { createRoute, z } from "@hono/zod-openapi";

export const addMusicsRoute = createRoute({
  tags: ["Asset"],
  method: "post",
  path: "/assets/musics",
  summary: "Add multiple musics",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            files: z.array(z.instanceof(File)).openapi({
              items: {
                type: "string",
                format: "binary",
              },
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      content: {
        "application/json": { schema: z.object({ message: z.string() }) },
      },
    },
  },
});
