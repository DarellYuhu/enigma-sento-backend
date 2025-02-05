import { OpenAPIHono } from "@hono/zod-openapi";
import { addMusicsRoute } from "./asset.route";
import { addMusics } from "./asset.service";

const asset = new OpenAPIHono();

asset.openapi(addMusicsRoute, async (c) => {
  const { files } = c.req.valid("form");
  await addMusics(files as File[]);
  return c.json({ message: "ok" });
});

export default asset;
