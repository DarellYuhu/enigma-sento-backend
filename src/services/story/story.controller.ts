import { OpenAPIHono } from "@hono/zod-openapi";
import { createStoryRoute } from "./story.route";
import { dataConfigType1 } from "./story.schema";
import { HTTPException } from "hono/http-exception";
import { createStory } from "./story.service";

const story = new OpenAPIHono();

story.openapi(createStoryRoute, async (c) => {
  const payload = c.req.valid("form");
  const {
    success,
    data: config,
    error,
  } = dataConfigType1.safeParse(JSON.parse(payload.data as string));
  if (!success)
    throw new HTTPException(400, {
      message: error.message,
    });
  const data = await createStory({ ...payload, data: config });
  return c.json({
    message: "Story created successfully",
    data,
  });
});

export default story;
