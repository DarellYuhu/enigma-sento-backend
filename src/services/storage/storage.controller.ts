import { OpenAPIHono } from "@hono/zod-openapi";
import { getUploadUrlRoute } from "./storage.route";
import { getUploadUrl } from "./storage.service";

const storage = new OpenAPIHono();

storage.openapi(getUploadUrlRoute, (c) => {
  const { path } = c.req.valid("query");
  const data = getUploadUrl(path);
  return c.json({ message: "Ok", data });
});

export default storage;
