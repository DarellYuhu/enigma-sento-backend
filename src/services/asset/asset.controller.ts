import { OpenAPIHono } from "@hono/zod-openapi";
import { addFontsRoute, addMusicsRoute, getAllMusicRoute } from "./asset.route";
import { addFonts, addMusics, getAllMusic } from "./asset.service";

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

asset.openapi(addFontsRoute, async (c) => {
  const payload = c.req.valid("json");
  const result = await addFonts(payload);
  return c.json({ message: "ok", data: result });
});

export default asset;
