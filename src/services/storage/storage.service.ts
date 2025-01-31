import { minio } from "@/db";

export const postFileToMinio = async ( file: File , path: string, bucketName = 'default') => {
  const arrayBuffer = await file.arrayBuffer();
  const fileName = `${path}/${file.name}`;
  await minio.putObject(
    bucketName,
    fileName,
    Buffer.from(arrayBuffer),
    file.size,
    {
      "Content-Type": file.type,
    }
  );
  return await minio.presignedGetObject(bucketName, fileName, 50000);
};

export const getDownloadUrl = (path: string) => {
  return minio.presignedGetObject("images", path, 50000);
};
