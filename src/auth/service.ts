import { prisma } from "@/db";
import { HTTPException } from "hono/http-exception";
import { LoginSchema } from "./schema";
import { sign } from "hono/jwt";

const signIn = async (data: LoginSchema) => {
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
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 3,
    },
    process.env.JWT_SECRET ?? ""
  );
  return {
    token,
    user: { id: user.id, displayName: user.displayName, role: user.role },
  };
};

export { signIn };
