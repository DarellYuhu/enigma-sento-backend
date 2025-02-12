import { minioS3 } from "@/db";

export const postFileToMinio = async (
  file: File,
  path: string,
  bucketName = "default"
) => {
  const arrayBuffer = await file.arrayBuffer();
  const fileName = `${path}/${file.name}`;
  await minioS3.write(fileName, arrayBuffer, {
    bucket: bucketName,
    type: file.type,
  });
  return minioS3.presign(fileName, { bucket: bucketName, method: "GET" });
};

export const getDownloadUrl = (path: string) => {
  return minioS3.presign(path, { bucket: "images", method: "GET" });
};

export const getUploadUrl = (path: string) => {
  return minioS3.presign(path, { bucket: "tmp", method: "PUT" });
};
