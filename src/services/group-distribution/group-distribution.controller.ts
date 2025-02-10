import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createGroupDistributionRoute,
  downloadGroupDistributionRoute,
  exportGeneratedTaskRoute,
  generateTaskDistributionRoute,
  getGroupDistributionsRoute,
} from "./group-distribution.route";
import {
  addGroupDistributions,
  exportGeneratedTask,
  generateTaskDistribution,
  getGeneratedContent,
  getGroupDistributions,
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

groupDistribution.openapi(getGroupDistributionsRoute, async (c) => {
  const { id } = c.req.param();
  const data = await getGroupDistributions(id);
  return c.json({ message: "ok", data });
});

groupDistribution.openapi(downloadGroupDistributionRoute, async (c) => {
  const { id } = c.req.param();
  const { projectIds } = c.req.valid("json");
  const { fileName, fileBuffer: buffer } = await getGeneratedContent(
    id,
    projectIds
  );

  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Disposition", `attachment; filename=${fileName}`);
  return c.body(buffer);
});

groupDistribution.openapi(exportGeneratedTaskRoute, async (c) => {
  const { id } = c.req.valid("param");
  const { fileName, fileBuffer: buffer } = await exportGeneratedTask(id);
  c.header("Content-Type", "application/octet-stream");
  c.header("Content-Disposition", `attachment; filename=${fileName}`);
  return c.body(buffer);
});

export default groupDistribution;
