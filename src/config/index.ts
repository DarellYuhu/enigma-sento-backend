export const config = {
  PORT: process.env["PORT"] ?? 3000,
  JWT_SECRET: process.env["JWT_SECRET"] ?? "",
  ALLOWED_ORIGINS: process.env["ALLOWED_ORIGINS"] ?? "",
};
