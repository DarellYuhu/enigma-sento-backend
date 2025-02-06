import { OpenAPIHono } from "@hono/zod-openapi";
import { addMusicsRoute, getAllMusicRoute } from "./asset.route";
import { addMusics, getAllMusic } from "./asset.service";

const asset = new OpenAPIHono();

asset.openapi(addMusicsRoute, async (c) => {
  const { files } = c.req.valid("form");
  await addMusics(files as File[]);
  return c.json({ message: "ok" });
});

asset.openapi(getAllMusicRoute, async (c) => {
  const data = await getAllMusic();
  return c.json({ message: "ok", data });
});

export default asset;
