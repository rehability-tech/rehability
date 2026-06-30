import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.12"],
  devIndicators: false,

  compress: true,
  poweredByHeader: false,

  images: {
    // AVIF dla przeglądarek które go wspierają (mniejszy o ~30% od WebP),
    // WebP jako fallback dla starszych. Oba lepiej kompresują od JPG/PNG.
    formats: ["image/avif", "image/webp"],
    // Next 16 wymaga jawnej listy dozwolonych wartości `quality` w <Image>.
    // 75 = domyślna, 80 = okładki hero (campy_hero).
    qualities: [75, 80],
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
      {
        protocol: "https",
        hostname: "images.pexels.com",
        port: "",
        pathname: "/**",
      },
      // Bunny Stream CDN — automatyczne miniatury (kadry) wideo kursów.
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "example.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "framer-motion"],
    // Inline critical CSS (above-the-fold) i defer resztę — eliminuje render-blocking CSS.
    optimizeCss: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.onesignal.com https://onesignal.com https://js.stripe.com https://checkout.stripe.com https://maps.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' blob: data: https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com https://*.googleusercontent.com https://images.unsplash.com https://img.youtube.com https://images.pexels.com https://maps.gstatic.com https://maps.googleapis.com https://*.b-cdn.net",
              "connect-src 'self' https://api.stripe.com https://onesignal.com https://*.onesignal.com https://rehabilityprudnik.pl https://www.rehabilityprudnik.pl https://maps.googleapis.com https://video.bunnycdn.com https://*.b-cdn.net https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com https://images.pexels.com",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://iframe.mediadelivery.net",
              "media-src 'self' https://wkel0sdzlinz0k7a.public.blob.vercel-storage.com blob: https://*.b-cdn.net",
              "worker-src 'self' blob: https://cdn.onesignal.com",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    // 301 ze starych ścieżek /campy/* → /wyjazdy/* po refactorze nazewnictwa.
    // Potrzebne dla SEO i dla Stripe Checkout sesji w locie wystawionych przed deployem.
    return [
      { source: "/campy", destination: "/wyjazdy", permanent: true },
      {
        source: "/campy/:path*",
        destination: "/wyjazdy/:path*",
        permanent: true,
      },
      {
        source: "/panel/campy",
        destination: "/panel/wyjazdy",
        permanent: true,
      },
      {
        source: "/panel/campy/:path*",
        destination: "/panel/wyjazdy/:path*",
        permanent: true,
      },
      {
        source: "/admin/campy",
        destination: "/admin/wyjazdy",
        permanent: true,
      },
      {
        source: "/admin/campy/:path*",
        destination: "/admin/wyjazdy/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
