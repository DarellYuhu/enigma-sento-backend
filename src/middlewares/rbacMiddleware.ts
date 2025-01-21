import type { TokenPayload } from "@/types";
import type { Role } from "@prisma/client";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const rbacMiddleware = (role: Role[]) =>
  createMiddleware(async (c, next) => {
    const jwtPayload: TokenPayload = c.get("jwtPayload");
    if (!role.includes(jwtPayload.role as Role))
      throw new HTTPException(403, { message: "Forbidden" });
    return next();
  });
