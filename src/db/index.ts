import { config } from "@/config";
import { PrismaClient } from "@prisma/client";
import { Client } from "minio";

const prisma = new PrismaClient();
const minio = new Client({
  endPoint: "localhost",
  port: config.MINIO_PORT as number,
  useSSL: false,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

export { prisma, minio };
