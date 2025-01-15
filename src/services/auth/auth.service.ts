import { prisma } from "@/db";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import type { SignInSchema } from "./auth.schema";
import { config } from "@/config";
import { addDays } from "date-fns";
const signIn = async (data: SignInSchema) => {
  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (!user)
    throw new HTTPException(401, { message: "Invalid username or password" });
  const isValid = await Bun.password.verify(data.password, user.password);
  if (!isValid)
    throw new HTTPException(401, { message: "Invalid username or password" });
  const token = await sign(
    {
      sub: user.id,
      role: user.role,
      name: user.displayName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(addDays(new Date(), 3).getTime() / 1000),
    },
    config.JWT_SECRET ?? ""
  );
  return {
    token,
    user: { id: user.id, displayName: user.displayName, role: user.role },
  };
};

export { signIn };
