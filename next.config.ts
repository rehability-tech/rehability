import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app"],
  devIndicators: {
    position: "top-right", // Możesz też użyć "top-left"
  },
  compress: true,
  poweredByHeader: false,
  images: {
    // AVIF dla przeglądarek które go wspierają (mniejszy o ~30% od WebP),
    // WebP jako fallback dla starszych. Oba lepiej kompresują od JPG/PNG.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wkel0sdzlinz0k7a.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
      // NOWE: Zezwolenie na pobieranie avatarów z Google
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    // Tree-shake'uje barrel exports zamiast ładować cały pakiet.
    // Phosphor/framer mają setki modułów i bez tego pakują dużo dead code.
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
  },
};

export default nextConfig;
