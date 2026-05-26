"use client";

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { motion, Variants } from "framer-motion";
import {
  Bus as BusIcon,
  FlowerLotus as FlowerLotusIcon,
  PersonSimpleTaiChi as PersonSimpleTaiChiIcon,
} from "@phosphor-icons/react/dist/ssr";

// --- 1. DEFINICJE ANIMACJI (Framer Motion) ---

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const imageRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const badgePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    // Tutaj TS przestanie krzyczeć na type: "spring"
    transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.3 },
  },
};
// --- 2. WYDZIELONE BLOKI ---

const HeaderBlock = () => (
  <motion.div
    variants={fadeUpVariants}
    className="flex flex-col items-start max-[1024px]:items-center gap-8 max-[1024px]:w-[90%] max-[1024px]:mx-auto text-left max-[1024px]:text-center"
  >
    <h1 className="typography-heading text-brand-secondary w-[650px] min-w-[200%] max-[1024px]:w-full max-[1024px]:min-w-0">
      Nowoczesna <span className="text-brand-primary">fizjoterapia</span> w
      Prudniku.
    </h1>
    <Button showArrow href="/wyjazdy">
      Zobacz terminy
    </Button>
  </motion.div>
);

const ParagraphsBlock = () => (
  <motion.div
    variants={fadeUpVariants}
    className="flex flex-col gap-6 typography-paragraph text-brand-secondary/80 mt-12 max-[1024px]:mt-0 max-[1024px]:w-[90%] max-[1024px]:mx-auto max-[1024px]:text-center"
  >
    <p>
      Rozumiemy, że przewlekły ból i kontuzje potrafią zatrzymać Twoje życie.
    </p>
    <p>
      W Rehability łączymy terapię manualną, osteopatię i najnowszą wiedzę
      medyczną, dostarczając Ci plan leczenia, który realnie działa.
    </p>
  </motion.div>
);

const FizjoBlock = ({ className = "" }: { className?: string }) => (
  <motion.div
    variants={imageRevealVariants}
    className={`relative w-full max-w-[400px] mx-auto mt-12 max-[1024px]:mt-0 ${className}`}
  >
    <div className="relative w-full aspect-[3/4] h-[700px] max-[1024px]:h-[400px] rounded-t-[200px] rounded-b-[40px] overflow-hidden shadow-xl bg-gray-100">
      <Image
        src="/images/hero/fizjoterapia_hero.jpg"
        alt="Fizjoterapia w trakcie"
        fill
        priority
        fetchPriority="high"
        sizes="(max-width: 1024px) 90vw, 33vw"
        className="object-cover"
      />
    </div>
    <HeroBadge
      text="Fizjoterapia"
      className="absolute top-[30%] max-[1024px]:top-[60%] -right-12 max-[1024px]:-right-4 z-20 max-[1024px]:scale-90 max-[1024px]:origin-right"
      icon={<PersonSimpleTaiChiIcon size={20} />}
    />
  </motion.div>
);

const RelaxBlock = () => (
  <motion.div
    variants={imageRevealVariants}
    className="relative w-full max-w-[320px] max-[575px]:max-w-[320px] max-[675px]:w-[90%] mx-0 max-[1024px]:mx-auto mt-8 max-[1024px]:mt-0"
  >
    <div className="mask-shape-1 aspect-square relative bg-gray-100 w-[250px] max-[1024px]:w-full">
      <Image
        src="/images/hero/relax_hero.jpg"
        alt="Strefa relaksu"
        fill
        loading="eager"
        sizes="(max-width: 1024px) 45vw, 20vw"
        className="object-cover transition-transform hover:scale-105 duration-700"
      />
    </div>
    <HeroBadge
      text="Strefa wellness i masażu"
      className="absolute top-8 -right-12 max-[1024px]:top-24 z-20 max-[1024px]:-right-12 max-[450px]:right-0 max-[450px]:bottom-6 max-[450px]:top-42"
      icon={<FlowerLotusIcon size={20} />}
    />
  </motion.div>
);

const CampyBlock = () => (
  <motion.div
    variants={imageRevealVariants}
    className="relative w-full max-w-[350px] max-[675px]:max-w-[320px] max-[675px]:w-[90%] ml-auto max-[1024px]:mx-auto"
  >
    <div className="mask-shape-2 w-full aspect-square relative bg-gray-100">
      <Image
        src="/images/hero/campy_hero.jpg"
        alt="Wyjazdy i wyjazdy"
        fill
        loading="eager"
        sizes="(max-width: 1024px) 45vw, 25vw"
        className="object-cover transition-transform hover:scale-105 duration-700"
      />
    </div>
    <HeroBadge
      text="Wyjazdy holistyczne"
      className="absolute bottom-12 left-12 max-[1024px]:left-12 max-[1024px]:bottom-12 z-20 max-[1024px]:origin-bottom-left"
      icon={<BusIcon size={18} />}
    />
  </motion.div>
);

const BottomTextBlock = () => (
  <motion.div
    variants={fadeUpVariants}
    className="flex flex-col items-start max-[1024px]:items-center gap-6 mt-18 max-[1024px]:mt-4 max-[1024px]:text-center max-[1024px]:w-[90%] max-[1024px]:mx-auto"
  >
    <h3 className="font-montserrat font-bold text-[22px] text-brand-secondary">
      Wejdź na wyższy poziom.
    </h3>
    <p className="typography-paragraph text-brand-secondary/80">
      Poznaj autorskie metody diagnostyki i terapii. Rozwiń swój warsztat dzięki
      kursom VOD i zjazdom na Campach.
    </p>
    {/* Brak trasy /platforma-vod — placeholder /w-budowie do czasu uruchomienia. */}
    <Button variant="primary" showArrow href="/w-budowie">
      Dołącz do platformy
    </Button>
  </motion.div>
);

// --- 3. GŁÓWNY KOMPONENT ---
export function HeroSection() {
  return (
    <section className="relative pt-8 max-[1024px]:pt-24 overflow-hidden">
      {/* WIDOK MOBILE (Działa do 1024px) */}
      {/* Używamy viewport={{ once: true }} aby animacja zagrała tylko przy pierwszym wejściu na stronę */}
      <motion.div
        className="container flex-col gap-10 relative z-10 items-center hidden max-[1024px]:flex"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
      >
        <HeaderBlock />
        <FizjoBlock />
        <ParagraphsBlock />

        <div className="grid grid-cols-2 max-[675px]:grid-cols-1 gap-4 max-[675px]:gap-12 w-full mt-4">
          <RelaxBlock />
          <CampyBlock />
        </div>

        <BottomTextBlock />
      </motion.div>

      {/* WIDOK DESKTOP (Powyżej 1024px) */}
      <motion.div
        className="container grid grid-cols-12 gap-12 items-start relative z-10 max-[1024px]:hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={containerVariants}
      >
        <div className="col-span-4 flex flex-col gap-12">
          <HeaderBlock />
          <RelaxBlock />
          <ParagraphsBlock />
        </div>

        <FizjoBlock className="col-span-4 self-end" />

        <div className="col-span-4 flex flex-col gap-12 -mt-8">
          <CampyBlock />
          <BottomTextBlock />
        </div>
      </motion.div>
    </section>
  );
}

// --- 4. KOMPONENT POMOCNICZY ---
function HeroBadge({
  text,
  className,
  icon,
}: {
  text: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    // Pigułka również otrzymała swoje warianty animacji, odziedziczy trigger od rodzica (FizjoBlock/RelaxBlock)
    <motion.div
      variants={badgePopVariants}
      className={`flex items-center h-[32px] pl-[5px] pr-[12px] gap-[6px] bg-brand-primary text-white rounded-full shadow-md w-fit ${
        className || ""
      }`}
    >
      {icon && (
        <div className="flex shrink-0 items-center justify-center bg-white text-brand-secondary rounded-full w-[26px] h-[26px] [&>svg]:fill-brand-secondary">
          {icon}
        </div>
      )}
      <span className="font-montserrat font-medium text-[12px] whitespace-nowrap">
        {text}
      </span>
    </motion.div>
  );
}
