import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createStoryRoute,
  deleteStoryRoute,
  generateContentRoute,
  updateStoryRoute,
} from "./story.route";
import { dataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import {
  createStory,
  deleteStory,
  generateContent,
  updateStory,
} from "./story.service";

const story = new OpenAPIHono();

story.openapi(createStoryRoute, async (c) => {
  const { images, ...payload } = c.req.valid("form");
  let jsonConfig: any = null;
  let imagesPayload: File[] = [];
  if (payload.type === "SYSTEM_GENERATE") {
    const {
      success,
      data: config,
      error,
    } = dataConfigType1.safeParse(JSON.parse(payload.data as string));
    if (!Array.isArray(images)) imagesPayload.push(images as File);
    else imagesPayload = images as File[];
    if (!success)
      throw new HTTPException(400, {
        message: error.message,
      });
    jsonConfig = config;
  }
  const data = await createStory({
    ...payload,
    data: jsonConfig,
    images: imagesPayload,
  });
  return c.json({
    message: "Story created successfully",
    data,
  });
});

story.openapi(updateStoryRoute, async (c) => {
  const { id } = c.req.param();
  const payload = c.req.valid("json");
  const data = await updateStory(payload, id);
  return c.json({
    message: "Story updated successfully",
    data,
  });
});

story.openapi(generateContentRoute, async (c) => {
  const { id } = c.req.param();
  const { withMusic } = c.req.valid("query");
  console.log("huhi");
  await generateContent(id, withMusic);
  return c.json({ message: "ok" });
});

story.openapi(deleteStoryRoute, async (c) => {
  const { id } = c.req.param();
  await deleteStory(id);
  return c.json({ message: "Story deleted" });
});

export default story;
