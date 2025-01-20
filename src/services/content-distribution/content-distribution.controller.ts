import { OpenAPIHono } from "@hono/zod-openapi";
import { generateContentDistributionRoute } from "./content-distribution.route";
import { generateContentDistribution } from "./content-distribution.service";

const contentDistribution = new OpenAPIHono();

contentDistribution.openapi(generateContentDistributionRoute, async (c) => {
  const { id } = c.req.param();
  const data = await generateContentDistribution(id);

  return c.json({ message: "ok", data });
});

export default contentDistribution;
