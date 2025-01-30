import { OpenAPIHono } from "@hono/zod-openapi";
import {
  generateContentDistributionRoute,
  postGeneratedContentRoute,
} from "./content-distribution.route";
import {
  generateContentDistribution,
  postGeneratedContent,
} from "./content-distribution.service";

const contentDistribution = new OpenAPIHono();

contentDistribution.openapi(generateContentDistributionRoute, async (c) => {
  const { id } = c.req.param();
  const data = await generateContentDistribution(id);

  return c.json({ message: "ok", data });
});

contentDistribution.openapi(postGeneratedContentRoute, async (c) => {
  const { storyId, files } = c.req.valid("form");
  const data = await postGeneratedContent(storyId, files as File[]);
  return c.json({ message: "ok", data });
});

export default contentDistribution;
