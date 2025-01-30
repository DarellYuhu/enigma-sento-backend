import { minio } from "@/db";

export const postFileToMinio = async (file: File, path: string) => {
  const arrayBuffer = await file.arrayBuffer();
  const fileName = `${path}/${Date.now()}_${file.name}`;
  await minio.putObject(
    "images",
    fileName,
    Buffer.from(arrayBuffer),
    file.size,
    {
      "Content-Type": file.type,
    }
  );
  return await minio.presignedGetObject("images", fileName, 50000);
};

export const getDownloadUrl = (path: string) => {
  return minio.presignedGetObject("images", path, 50000);
};
