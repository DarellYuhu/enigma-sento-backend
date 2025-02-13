import { config } from "@/config";
import { Font } from "@/services/asset/entities/font";
import { PrismaClient } from "@prisma/client";
import { Client } from "minio";
import mongoose from "mongoose";

const prisma = new PrismaClient();
const minio = new Client({
  endPoint: config.MINIO_HOST,
  port: config.MINIO_PORT as number,
  useSSL: false,
  accessKey: config.MINIO_ACCESS_KEY,
  secretKey: config.MINIO_SECRET_KEY,
});
const minioS3 = new Bun.S3Client({
  endpoint: `http://${config.MINIO_HOST}:${config.MINIO_PORT}`,
  accessKeyId: config.MINIO_ACCESS_KEY,
  secretAccessKey: config.MINIO_SECRET_KEY,
});

const connectMongo = async () => {
  try {
    await mongoose.connect(config.MONGO_URI, { dbName: "enigma-sento" });
    await Font.createIndexes();
  } catch (error) {
    console.error("MongoDB connection error: ", error);
  }
};

export { prisma, minio, minioS3, connectMongo };
