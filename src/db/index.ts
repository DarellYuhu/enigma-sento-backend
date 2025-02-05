import { config } from "@/config";
import { PrismaClient } from "@prisma/client";
import { Client } from "minio";
import { Mongoose } from "mongoose";

const prisma = new PrismaClient();
const minio = new Client({
  endPoint: config.MINIO_HOST,
  port: config.MINIO_PORT as number,
  useSSL: false,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});

const mongo = new Mongoose();

export { prisma, minio };
