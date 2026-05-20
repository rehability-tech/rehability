"use client";

import { FAQSection } from "@/components/FaqSection";
import { CTASection } from "./_components/CTASection";
import { EcosystemSection } from "./_components/EcosystemSection";
import { HeroSection } from "./_components/HeroSection";
import { ValuesSection } from "./_components/ValuesSection";
import { WhySection } from "./_components/WhySection";

export default function AboutUsPage() {
  return (
    <main className="flex flex-col gap-50 max-[1024px]:gap-72  ">
      <HeroSection />
      <WhySection />
      <EcosystemSection />
      <ValuesSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}
