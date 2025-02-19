import { OpenAPIHono } from "@hono/zod-openapi";
import {
  generateContentDistributionRoute,
  postGeneratedContentRoute,
} from "./content-distribution.route";
import {
  generateContentDistribution,
  postGeneratedContent,
} from "./content-distribution.service";
import { shuffle } from "lodash";

const contentDistribution = new OpenAPIHono();

contentDistribution.openapi(generateContentDistributionRoute, async (c) => {
  const { id } = c.req.param();
  await generateContentDistribution(id);
  return c.json({ message: "ok" });
});

contentDistribution.openapi(postGeneratedContentRoute, async (c) => {
  const { storyId, files } = c.req.valid("json");
  const random = shuffle(files);
  await postGeneratedContent(storyId, random);
  return c.json({ message: "ok" });
});

export default contentDistribution;
