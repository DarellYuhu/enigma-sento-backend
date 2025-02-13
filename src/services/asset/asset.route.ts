import { createRoute, z } from "@hono/zod-openapi";
import { musicZod } from "./entities/music";

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

export const getAllMusicRoute = createRoute({
  method: "get",
  path: "/assets/musics",
  tags: ["Asset"],
  summary: "Get all musics",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
            data: z.array(musicZod),
          }),
        },
      },
    },
  },
});
