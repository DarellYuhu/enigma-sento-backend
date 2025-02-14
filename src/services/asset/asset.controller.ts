import { OpenAPIHono } from "@hono/zod-openapi";
import {
  addColorsRoute,
  addFontsRoute,
  addMusicsRoute,
  getAllFontsRoute,
  getAllMusicRoute,
  getColorsRoute,
} from "./asset.route";
import {
  addColors,
  addFonts,
  addMusics,
  getAllFonts,
  getAllMusic,
  getColors,
} from "./asset.service";

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

asset.openapi(getAllFontsRoute, async (c) => {
  const data = await getAllFonts();
  return c.json({ message: "ok", data });
});

asset.openapi(addColorsRoute, async (c) => {
  const { file } = c.req.valid("form");
  await addColors(file as File);
  return c.json({ message: "ok" });
});

asset.openapi(getColorsRoute, async (c) => {
  const data = await getColors();
  return c.json({ message: "ok", data });
});
export default asset;
