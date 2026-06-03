"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { geminiFetch } from "@/lib/gemini/clientRateLimiter";
import { truncateSmart } from "@/lib/seo/utils";

interface PostRaw {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  status?: string;
  publishedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean | null;
}

function buildPostSummary(post: PostRaw): string {
  const contentText =
    typeof post.content === "string"
      ? post.content
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 4000)
      : "";

  return [
    `Tytuł artykułu: ${post.title || ""}`,
    post.slug ? `Slug: ${post.slug}` : "",
    post.excerpt ? `Excerpt: ${post.excerpt}` : "",
    contentText ? `Treść artykułu:\n${contentText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function useBlogSeoForm(postId: string | null) {
  const router = useRouter();

  const [postTitle, setPostTitle] = useState("");
  const [postSlug, setPostSlug] = useState("");
  const [postExcerpt, setPostExcerpt] = useState("");
  const [postRaw, setPostRaw] = useState<PostRaw | null>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const [postStatus, setPostStatus] = useState<string>("DRAFT");
  const [postPublishedAt, setPostPublishedAt] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatusMsg, setGenStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    const fetchPost = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`/api/admin/blog/${postId}`);
        if (!res.ok) throw new Error();
        const data: PostRaw = await res.json();

        setPostRaw(data);
        setPostTitle(data.title || "");
        setPostSlug(data.slug || "");
        setPostExcerpt(data.excerpt || "");

        setMetaTitle(data.metaTitle ?? truncateSmart(data.title, 60));
        setMetaDescription(
          data.metaDescription ?? truncateSmart(data.excerpt, 160),
        );
        setFocusKeyword(data.focusKeyword || "");
        setOgImage(data.ogImage || data.coverImage || "");
        setCanonicalUrl(data.canonicalUrl || "");
        setNoIndex(data.noIndex ?? false);
        setPostStatus(data.status || "DRAFT");
        setPostPublishedAt(data.publishedAt || null);
      } catch {
        toast.error("Nie udało się załadować danych SEO.");
      } finally {
        setIsFetching(false);
      }
    };
    fetchPost();
  }, [postId]);

  const persistSeo = useCallback(
    async (overrides: {
      metaTitle: string;
      metaDescription: string;
      focusKeyword: string;
    }) => {
      if (!postId) return;
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "seo",
          metaTitle: overrides.metaTitle,
          metaDescription: overrides.metaDescription,
          focusKeyword: overrides.focusKeyword,
          ogImage,
          canonicalUrl,
          noIndex,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd zapisu SEO");
      }
    },
    [postId, ogImage, canonicalUrl, noIndex],
  );

  const generateSeo = useCallback(async () => {
    if (!postRaw) {
      toast.error("Dane artykułu jeszcze się ładują.");
      return;
    }

    setIsGenerating(true);
    setGenStatusMsg("Łączenie z AI…");
    try {
      const res = await geminiFetch(
        "/api/admin/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: buildPostSummary(postRaw),
            action: "generateBlogSeo",
          }),
        },
        {
          onStatus: (status) => {
            if (status.kind === "waiting") {
              const label =
                status.reason === "ratelimit"
                  ? `Limit Gemini — wznowię za ${status.countdown}s`
                  : `Błąd Gemini — ponawiam (${status.attempt}/${status.maxAttempts}) za ${status.countdown}s`;
              setGenStatusMsg(label);
            } else {
              setGenStatusMsg("AI optymalizuje tytuł i opis dla Google…");
            }
          },
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Błąd generowania SEO.");
      }

      const seo = (await res.json()) as {
        metaTitle?: string;
        metaDescription?: string;
        focusKeyword?: string;
      };

      const nextMetaTitle = seo.metaTitle ?? metaTitle;
      const nextMetaDescription = seo.metaDescription ?? metaDescription;
      const nextFocusKeyword = seo.focusKeyword ?? focusKeyword;

      if (seo.metaTitle) setMetaTitle(seo.metaTitle);
      if (seo.metaDescription) setMetaDescription(seo.metaDescription);
      if (seo.focusKeyword) setFocusKeyword(seo.focusKeyword);

      if (postId) {
        try {
          await persistSeo({
            metaTitle: nextMetaTitle,
            metaDescription: nextMetaDescription,
            focusKeyword: nextFocusKeyword,
          });
          toast.success("Wygenerowano i zapisano dane SEO!");
        } catch (persistErr) {
          toast.error(
            persistErr instanceof Error
              ? `Wygenerowano, ale nie zapisano: ${persistErr.message}`
              : "Wygenerowano, ale zapis się nie udał.",
          );
        }
      } else {
        toast.success("Wygenerowano dane SEO!");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Nie udało się wygenerować.",
      );
    } finally {
      setIsGenerating(false);
      setGenStatusMsg(null);
    }
  }, [
    postRaw,
    postId,
    metaTitle,
    metaDescription,
    focusKeyword,
    persistSeo,
  ]);

  const saveSeo = useCallback(
    async (redirect = true) => {
      if (!postId) {
        toast.error("Brak ID posta.");
        return;
      }
      setIsSaving(true);
      try {
        await persistSeo({ metaTitle, metaDescription, focusKeyword });
        toast.success("Dane SEO zapisane!");
        if (redirect) router.push("/admin/blog");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Błąd serwera.");
      } finally {
        setIsSaving(false);
      }
    },
    [postId, metaTitle, metaDescription, focusKeyword, persistSeo, router],
  );

  return {
    postTitle,
    postSlug,
    postExcerpt,
    postStatus,
    postPublishedAt,
    postRaw,

    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    focusKeyword,
    setFocusKeyword,
    ogImage,
    setOgImage,
    canonicalUrl,
    setCanonicalUrl,
    noIndex,
    setNoIndex,

    isFetching,
    isSaving,
    isGenerating,
    genStatusMsg,

    generateSeo,
    saveSeo,
  };
}
