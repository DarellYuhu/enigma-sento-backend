import { createRoute, z } from "@hono/zod-openapi";
import { updateStoryBody } from "./story.schema";
import { rbacMiddleware } from "@/middlewares/rbacMiddleware";
import { config } from "@/config";
import { jwt } from "hono/jwt";
import { storyZod } from "./entities/story";

export const createStoryRoute = createRoute({
  tags: ["Story"],
  method: "post",
  path: "/stories",
  request: {
    body: {
      content: {
        "application/json": {
          schema: storyZod,
        },
      },
    },
  },
  responses: {
    201: {
      description: "CREATED",
      content: {
        "application/json": {
          schema: z.object({
            message: z.string(),
          }),
        },
      },
    },
  },
});

export const updateStoryRoute = createRoute({
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
    },
  },
});

export const generateContentRoute = createRoute({
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

export const deleteStoryRoute = createRoute({
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

export const updateSectionRoute = createRoute({
  tags: ["Story"],
  path: "/stories/{id}/sections/{sectionId}",
  method: "patch",
  request: {
    params: z.object({ id: z.string(), sectionId: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            texts: z.array(z.string()).optional(),
            textColor: z.string().optional(),
            textBgColor: z.string().optional(),
            textStroke: z.string().optional(),
            textPosition: z.enum(["random", "middle", "bottom"]).optional(),
            images: z
              .array(
                z.object({
                  path: z.string(),
                  name: z.string(),
                  _id: z.string(),
                })
              )
              .optional(),
            deletedImages: z
              .array(
                z.object({
                  path: z.string(),
                  name: z.string(),
                  _id: z.string(),
                })
              )
              .optional(),
            newImages: z
              .array(
                z.object({
                  path: z.string(),
                  name: z.string(),
                })
              )
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "OK",
    },
  },
});
