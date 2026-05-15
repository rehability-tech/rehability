"use client";

import { FAQSection } from "@/components/sections/FaqSection";
import { CTASection } from "@/components/sections/o-nas/CTASection";
import { EcosystemSection } from "@/components/sections/o-nas/EcosystemSection";
import { HeroSection } from "@/components/sections/o-nas/HeroSection";
import { ValuesSection } from "@/components/sections/o-nas/ValuesSection";
import { WhySection } from "@/components/sections/o-nas/WhySection";

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
