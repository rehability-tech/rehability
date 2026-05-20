import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.12"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wkel0sdzlinz0k7a.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**", // Zezwala na dostęp do wszystkich zdjęć w tym Blobie
      },
      // Jeśli w przyszłości dodasz np. logowanie przez Google, dodasz tu też domenę avatarów Google
    ],
  },
};

export default nextConfig;
