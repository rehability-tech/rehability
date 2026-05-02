// app/(site)/page.tsx (lub src/app/(site)/page.tsx)

import { HeroSection } from "@/components/sections/HeroSection";

// Opcjonalnie: Metadata - musi być nazwanym eksportem (export const), NIE default
export const metadata = {
  title: "Start | Rehability",
};

// POPRAWKA: Musi być "export default" i zwracać prawidłowy JSX
export default function HomePage() {
  return (
    <div className="">
      <HeroSection />
    </div>
  );
}
