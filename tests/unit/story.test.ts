import { describe, test, mock } from "bun:test";
import { prisma } from "@/db";

mock.module("@/db", () => {
  return {
    prisma,
  };
});

describe("Create new story", () => {
  test("Success", () => {});
});
