import type { Metadata } from "next";

export const isEditorialIndexable = process.env.VERCEL_ENV === "production";

export const editorialRobots: Metadata["robots"] = {
  index: isEditorialIndexable,
  follow: isEditorialIndexable,
};
