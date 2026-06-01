import type { Metadata } from "next";
import { GabinetHero } from "./_components/GabinetHero";
import { GabinetSocialProof } from "./_components/GabinetSocialProof";
import GabinetServices from "./_components/GabinetServices";

export const metadata: Metadata = {
  title: "Fizjoterapia, Terapia Manualna i USG w Prudniku",
  description:
    "Skuteczne leczenie bólu kręgosłupa, rwy kulszowej i rehabilitacja po endoprotezie. Sprawdź naszą ofertę fizjoterapii i masażu tkanek głębokich w Prudniku.",
  alternates: { canonical: "/gabinet" },
  openGraph: {
    title: "Fizjoterapia, Terapia Manualna i USG w Prudniku",
    description:
      "Skuteczne leczenie bólu kręgosłupa, rwy kulszowej i rehabilitacja po endoprotezie. Sprawdź naszą ofertę fizjoterapii i masażu tkanek głębokich w Prudniku.",
    url: "/gabinet",
  },
};

export default function GabinetPage() {
  return (
    <div className="">
      <GabinetHero />
      <GabinetSocialProof />
      <GabinetServices />
    </div>
  );
}
