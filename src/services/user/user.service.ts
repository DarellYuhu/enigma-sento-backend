import { prisma } from "@/db";
import type { Prisma } from "@prisma/client";

const createUser = async (data: Prisma.UserCreateInput) => {
  const hashedPassword = await Bun.password.hash(data.password, {
    cost: 10,
    algorithm: "bcrypt",
  });
  return await prisma.user.create({
    data: { ...data, password: hashedPassword },
    omit: { password: true },
  });
};

export { createUser };
