import { z } from "zod";

export const blogBasicSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć co najmniej 3 znaki"),
  slug: z
    .string()
    .min(3, "Slug musi mieć co najmniej 3 znaki")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug może zawierać tylko małe litery, cyfry i myślniki"),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional().default("Ogólne"),
  tags: z.array(z.string()).optional().default([]),
  author: z.string().optional().default("Piotr Siemaszko"),
  readTime: z.coerce.number().int().min(1).optional(),
  lastStage: z.string().optional(),
});

export const blogContentSchema = z.object({
  content: z.any().optional(),
});

export const blogSeoSchema = z.object({
  metaTitle: z.string().max(70, "Meta tytuł nie może przekraczać 70 znaków").optional(),
  metaDescription: z.string().max(165, "Meta opis nie może przekraczać 165 znaków").optional(),
  focusKeyword: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  noIndex: z.boolean().optional().default(false),
});
