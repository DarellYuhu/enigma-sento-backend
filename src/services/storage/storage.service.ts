import { minioS3 } from "@/db";

export const postFileToMinio = async (
  file: File,
  path: string,
  bucketName = "default"
) => {
  const arrayBuffer = await file.arrayBuffer();
  const fileName = `${path}/${file.name}`;
  // await minio.putObject(
  //   bucketName,
  //   fileName,
  //   Buffer.from(arrayBuffer),
  //   file.size,
  //   {
  //     "Content-Type": file.type,
  //   }
  // );
  // return await minio.presignedGetObject(bucketName, fileName, 50000);
  await minioS3.write(fileName, arrayBuffer, {
    bucket: bucketName,
    type: file.type,
  });
  return minioS3.presign(fileName, { bucket: bucketName, method: "GET" });
};

export const getDownloadUrl = (path: string) => {
  // return minio.presignedGetObject("images", path, 50000);
  return minioS3.presign(path, { bucket: "images", method: "GET" });
};
