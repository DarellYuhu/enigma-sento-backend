import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createGroupDistributionRoute,
  generateTaskDistributionRoute,
} from "./group-distribution.route";
import {
  addGroupDistributions,
  generateTaskDistribution,
} from "./group-distribution.service";

const groupDistribution = new OpenAPIHono();

groupDistribution.openapi(createGroupDistributionRoute, async (c) => {
  const payload = c.req.valid("form");
  const { id } = c.req.param();
  const data = await addGroupDistributions(payload, id);
  return c.json({ message: "ok", data }, 201);
});

groupDistribution.openapi(generateTaskDistributionRoute, async (c) => {
  const { id } = c.req.param();
  const data = await generateTaskDistribution(id);
  return c.json({ data, message: "Generated" });
});

export default groupDistribution;
