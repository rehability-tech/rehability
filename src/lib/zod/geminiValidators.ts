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
    "generateBlogSingleBlock", // <-- Copywriter BLOGOWY (persona zdrowotna + SEO)
    "generateBlogContent",
    "generateBlogSeo",
    "generateCampSeo",
    "analyzeCampSeo",
    "fixCampSeo",
    "analyzeBlogSeo",
    "fixBlogSeo",
    "generateCourse",
    "generateCourseBlueprint",
    "generateCourseSingleBlock",
    "generateLessonMeta",
    "generateCourseStructure",
    "generateCourseSeo",
    "analyzeCourseSeo",
    "generateInvitationEmail",
  ]),

  // Pola używane wyłącznie przez Copywritera przy generowaniu pojedynczych klocków:
  blockType: z.string().optional(),
  topic: z.string().optional(),
  overallContext: z.string().optional(),
  // Główna fraza kluczowa (focus keyword) z harmonogramu — wplatana w treść pod SEO.
  focusKeyword: z.string().optional(),
});
