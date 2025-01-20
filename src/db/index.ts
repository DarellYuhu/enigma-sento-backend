import { PrismaClient } from "@prisma/client";
import { Client } from "minio";

const prisma = new PrismaClient();
const minio = new Client({
  endPoint: "localhost",
  port: (process.env["MINIO_PORT"] as unknown as number) ?? 9000,
  useSSL: false,
  accessKey: process.env["MINIO_ACCESS_KEY"] ?? "",
  secretKey: process.env["MINIO_SECRET_KEY"] ?? "",
});

export { prisma, minio };
