import z from "zod";

export const geminiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt nie może być pusty"),
  // Używamy enum, żeby zablokować jakiekolwiek niezdefiniowane akcje
  action: z.enum(["generateBasicInfo", "generateDescription", "generateBlog"]),
  model: z.string().optional(),
});
