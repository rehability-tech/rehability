import { GabinetHero } from "@/components/sections/gabinet/GabinetHero";
import { GabinetSocialProof } from "@/components/sections/gabinet/GabinetSocialProof";
import GabinetServices from "@/components/sections/gabinet/GabinetServices";

export default function GabinetPage() {
  return (
    <div className="">
      <GabinetHero />
      <GabinetSocialProof />
      <GabinetServices />
    </div>
  );
}
