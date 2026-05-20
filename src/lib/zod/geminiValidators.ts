import { z } from "zod";

export const geminiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt nie może być pusty"),
  model: z.string().optional(),
  action: z.enum([
    "generateBasicInfo",
    "generateBlueprint", // <-- Akcja dla Architekta
    "generateSingleBlock", // <-- Akcja dla Copywritera
    "generateDescription",
    "generateBlog",
    "generateBlogBasicData",
    "generateBlogBlueprint",
    "generateBlogContent",
    "generateBlogSeo",
  ]),

  // Pola używane wyłącznie przez Copywritera przy generowaniu pojedynczych klocków:
  blockType: z.string().optional(),
  topic: z.string().optional(),
  overallContext: z.string().optional(),
});
