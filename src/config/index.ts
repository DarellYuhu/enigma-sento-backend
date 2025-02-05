export const config = {
  PORT: process.env["PORT"] ?? 3000,
  JWT_SECRET: process.env["JWT_SECRET"] ?? "",
  ALLOWED_ORIGINS: process.env["ALLOWED_ORIGINS"] ?? "",
  MINIO_PORT: process.env["MINIO_PORT"] ?? 9000,
  MINIO_ACCESS_KEY: process.env["MINIO_ACCESS_KEY"] ?? "",
  MINIO_SECRET_KEY: process.env["MINIO_SECRET_KEY"] ?? "",
  MINIO_CLIENT_COMMAND: process.env["MINIO_CLIENT_COMMAND"] ?? "",
  MINIO_HOST: process.env["MINIO_HOST"] ?? "",
};
