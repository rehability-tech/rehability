import Image from "next/image";
import { Button } from "@/components/ui/Button";
import {
  Bus as BusIcon,
  FlowerLotus as FlowerLotusIcon,
  PersonSimpleTaiChi as PersonSimpleTaiChiIcon,
} from "@phosphor-icons/react/dist/ssr";

// --- 1. WYDZIELONE BLOKI (Teraz bezpiecznie zdefiniowane na zewnątrz!) ---

const HeaderBlock = () => (
  <div className="flex flex-col items-start max-[1024px]:items-center gap-8 max-[1024px]:w-[90%] max-[1024px]:mx-auto text-left max-[1024px]:text-center">
    <h1 className="typography-heading text-brand-secondary w-[650px] min-w-[200%] max-[1024px]:w-full max-[1024px]:min-w-0">
      Nowoczesna <span className="text-brand-primary">fizjoterapia</span> w
      Prudniku.
    </h1>
    <Button showArrow>Zobacz terminy</Button>
  </div>
);

const ParagraphsBlock = () => (
  <div className="flex flex-col gap-6 typography-paragraph text-brand-secondary/80 mt-12 max-[1024px]:mt-0 max-[1024px]:w-[90%] max-[1024px]:mx-auto max-[1024px]:text-center">
    <p>
      Rozumiemy, że przewlekły ból i kontuzje potrafią zatrzymać Twoje życie.
    </p>
    <p>
      W Rehability łączymy terapię manualną, osteopatię i najnowszą wiedzę
      medyczną, dostarczając Ci plan leczenia, który realnie działa.
    </p>
  </div>
);

const FizjoBlock = ({ className = "" }: { className?: string }) => (
  <div
    className={`relative w-full max-w-[400px] mx-auto mt-12 max-[1024px]:mt-0 ${className}`}
  >
    <div className="relative w-full aspect-[3/4] h-[700px] max-[1024px]:h-[400px] rounded-t-[200px] rounded-b-[40px] overflow-hidden shadow-xl bg-gray-100">
      <Image
        src="/images/hero/fizjoterapia_hero.jpg"
        alt="Fizjoterapia w trakcie"
        fill
        priority
        className="object-cover"
      />
    </div>
    <HeroBadge
      text="Fizjoterapia"
      className="absolute top-[30%] max-[1024px]:top-[60%] -right-12 max-[1024px]:-right-4 z-20 max-[1024px]:scale-90 max-[1024px]:origin-right"
      icon={<PersonSimpleTaiChiIcon size={20} />}
    />
  </div>
);

const RelaxBlock = () => (
  <div className="relative w-full max-w-[320px] max-[575px]:max-w-[320px] max-[675px]:w-[90%] mx-0 max-[1024px]:mx-auto mt-8 max-[1024px]:mt-0">
    <div className="mask-shape-1 aspect-square relative bg-gray-100 w-[250px] max-[1024px]:w-full">
      <Image
        src="/images/hero/relax_hero.jpg"
        alt="Strefa relaksu"
        fill
        priority
        className="object-cover"
      />
    </div>
    <HeroBadge
      text="Strefa wellness i masażu"
      className="absolute top-8 -right-12 max-[1024px]:top-24 z-20 max-[1024px]:-right-12 max-[450px]:right-0 max-[450px]:bottom-6 max-[450px]:top-42 "
      icon={<FlowerLotusIcon size={20} />}
    />
  </div>
);

const CampyBlock = () => (
  <div className="relative w-full max-w-[350px] max-[675px]:max-w-[320px] max-[675px]:w-[90%] ml-auto max-[1024px]:mx-auto">
    <div className="mask-shape-2 w-full aspect-square relative bg-gray-100">
      <Image
        src="/images/hero/campy_hero.jpg"
        alt="Campy i wyjazdy"
        fill
        priority
        className="object-cover"
      />
    </div>
    <HeroBadge
      text="Wyjazdy holistyczne"
      className="absolute bottom-12 left-12 max-[1024px]:left-12 max-[1024px]:bottom-12 z-20 max-[1024px]:origin-bottom-left"
      icon={<BusIcon size={18} />}
    />
  </div>
);

const BottomTextBlock = () => (
  <div className="flex flex-col items-start max-[1024px]:items-center gap-6 mt-18 max-[1024px]:mt-4 max-[1024px]:text-center max-[1024px]:w-[90%] max-[1024px]:mx-auto">
    <h3 className="font-montserrat font-bold text-[22px] text-brand-secondary">
      Wejdź na wyższy poziom.
    </h3>
    <p className="typography-paragraph text-brand-secondary/80">
      Poznaj autorskie metody diagnostyki i terapii. Rozwiń swój warsztat dzięki
      kursom VOD i zjazdom na Campach.
    </p>
    <Button variant="primary" showArrow>
      Dołącz do platformy
    </Button>
  </div>
);

// --- 2. GŁÓWNY KOMPONENT ---
export function HeroSection() {
  return (
    <section className="relative pt-8 max-[1024px]:pt-24  overflow-hidden ">
      {/* WIDOK MOBILE (Działa do 1024px) */}
      <div className="container flex-col gap-10 relative z-10 items-center hidden max-[1024px]:flex">
        <HeaderBlock />
        <FizjoBlock />
        <ParagraphsBlock />

        {/* Wiersz z obrazkami: po lewej/prawej, poniżej 675px staje się kolumną */}
        <div className="grid grid-cols-2 max-[675px]:grid-cols-1 gap-4 max-[675px]:gap-12 w-full mt-4">
          <RelaxBlock />
          <CampyBlock />
        </div>

        <BottomTextBlock />
      </div>

      {/* WIDOK DESKTOP (Powyżej 1024px) */}
      <div className="container grid grid-cols-12 gap-12 items-start relative z-10 max-[1024px]:hidden">
        <div className="col-span-4 flex flex-col gap-12">
          <HeaderBlock />
          <RelaxBlock />
          <ParagraphsBlock />
        </div>

        {/* Fizjoterapia wymuszona na dole rzędu */}
        <FizjoBlock className="col-span-4 self-end" />

        <div className="col-span-4 flex flex-col gap-12 -mt-8">
          <CampyBlock />
          <BottomTextBlock />
        </div>
      </div>
    </section>
  );
}

// --- 3. KOMPONENT POMOCNICZY ---
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
    <div
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
    </div>
  );
}
