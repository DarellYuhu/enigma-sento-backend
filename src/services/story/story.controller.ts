import { OpenAPIHono } from "@hono/zod-openapi";
import {
  createStoryRoute,
  deleteStoryRoute,
  generateContentRoute,
  updateSectionRoute,
  updateStoryRoute,
} from "./story.route";
import {
  createStory,
  deleteStory,
  generateContent,
  updateSection,
  updateStory,
} from "./story.service";

const story = new OpenAPIHono();

story.openapi(createStoryRoute, async (c) => {
  const payload = c.req.valid("json");
  const data = await createStory(payload);
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
  await generateContent(id, withMusic);
  return c.json({ message: "ok" });
});

story.openapi(deleteStoryRoute, async (c) => {
  const { id } = c.req.param();
  await deleteStory(id);
  return c.json({ message: "Story deleted" });
});

story.openapi(updateSectionRoute, async (c) => {
  const payload = c.req.valid("json");
  const { id, sectionId } = c.req.valid("param");
  const data = await updateSection(id, sectionId, payload);
  return c.json({ message: "ok", data });
});

export default story;
