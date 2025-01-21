import { z } from "zod";

const sheetSchema = z.array(
  z.object({
    code: z.string().trim().min(1, "Required"),
    amontOfTroops: z.number(),
  })
);

const createGroupDistributionBody = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.name.endsWith(".xlsx"),
      "Invalid file type. The file must be an XLSX file."
    ),
});

const createGroupDistributionResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      code: z.string(),
      amontOfTroops: z.number(),
      workgroupId: z.string(),
    })
  ),
});

const generateGroupDistributionTaskResponse = z.object({
  message: z.string(),
  data: z.object({
    workgroupId: z.string(),
    id: z.number(),
    createdAt: z.date(),
  }),
});

const getGroupDistributionsResponse = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      code: z.string(),
      amontOfTroops: z.number(),
      workgroupId: z.string(),
    })
  ),
});

export type CreateGroupDistributionBody = z.infer<
  typeof createGroupDistributionBody
>;

export {
  createGroupDistributionBody,
  createGroupDistributionResponse,
  generateGroupDistributionTaskResponse,
  getGroupDistributionsResponse,
  sheetSchema,
};
