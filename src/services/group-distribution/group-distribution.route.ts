import { createRoute, z } from "@hono/zod-openapi";
import {
  createGroupDistributionBody,
  createGroupDistributionResponse,
  generateGroupDistributionTaskResponse,
  getGroupDistributionsResponse,
} from "./group-distribution.schema";

const createGroupDistributionRoute = createRoute({
  method: "post",
  path: "/workgroup/{id}/group-distribution",
  tags: ["Group Distribution"],
  summary: "Create a new group distribution",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "multipart/form-data": {
          schema: createGroupDistributionBody,
        },
      },
    },
  },
  responses: {
    201: {
      description: "OK",
      content: {
        "application/json": {
          schema: createGroupDistributionResponse,
        },
      },
    },
  },
});

const generateTaskDistributionRoute = createRoute({
  tags: ["Workgroup"],
  method: "get",
  path: "/workgroup/{id}/generate-distribution",
  summary: "Generate group distribution for each user fairly",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: generateGroupDistributionTaskResponse,
        },
      },
    },
  },
});

const getGroupDistributionsRoute = createRoute({
  method: "get",
  path: "/workgroups/{id}/group-distributions",
  responses: {
    200: {
      description: "OK",
      content: {
        "application/json": {
          schema: getGroupDistributionsResponse,
        },
      },
    },
  },
});

const downloadGroupDistributionRoute = createRoute({
  method: "post",
  path: "/group-distributions/{id}/contents",
  summary: "Download generated contents",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ projectIds: z.array(z.string()) }),
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

export {
  downloadGroupDistributionRoute,
  createGroupDistributionRoute,
  generateTaskDistributionRoute,
  getGroupDistributionsRoute,
};
