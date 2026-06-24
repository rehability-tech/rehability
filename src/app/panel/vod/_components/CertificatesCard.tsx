import {
  Certificate,
  Sparkle,
  DownloadSimple,
} from "@phosphor-icons/react/dist/ssr";
import type { Course } from "@/app/(site)/kursy/_data/courses";

export function CertificatesCard({
  certified,
  count,
}: {
  certified: Course | null;
  count: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl rounded-tr-none bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_20px_60px_-30px_rgba(3,63,99,0.3)] p-6">
      <div className="pointer-events-none absolute -top-12 -left-10 w-44 h-44 rounded-full bg-brand-yellow/20 blur-[70px]" />
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Certificate size={18} weight="duotone" className="text-brand-primary" />
          <h3 className="font-jakarta font-bold text-[16px] text-brand-secondary">
            Twoje certyfikaty
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-brand-primary bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1">
          {count} wydane
        </span>
      </div>

      {certified ? (
        <div className="relative flex items-center gap-4 rounded-2xl rounded-tr-none bg-gradient-to-br from-brand-secondary via-brand-primary to-brand-secondary p-4 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.16] pointer-events-none bg-[radial-gradient(circle_at_85%_15%,#f2d967_0%,transparent_55%)]" />
          <span className="relative flex items-center justify-center size-12 shrink-0 rounded-2xl rounded-tr-none bg-white/15 text-brand-yellow">
            <Certificate size={26} weight="fill" />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-brand-yellow">
              Certyfikat ukończenia
            </p>
            <p className="font-jakarta font-bold text-[14px] text-white leading-snug line-clamp-1 mt-0.5">
              {certified.title}
            </p>
          </div>
          <button
            type="button"
            className="relative shrink-0 inline-flex items-center gap-1.5 bg-white text-brand-secondary font-montserrat font-bold text-[12px] px-3 py-2 rounded-xl rounded-tr-[3px] hover:shadow-[0_6px_16px_0px_rgba(242,217,103,0.5)] transition-all"
          >
            <DownloadSimple size={15} weight="bold" />
            PDF
          </button>
        </div>
      ) : (
        <p className="font-montserrat text-[13px] text-brand-secondary/55">
          Ukończ swój pierwszy kurs, aby odebrać certyfikat.
        </p>
      )}

      <p className="font-montserrat text-[12px] text-brand-secondary/45 mt-3 inline-flex items-center gap-1.5">
        <Sparkle size={13} weight="fill" className="text-brand-yellow" />
        Ukończ kolejny kurs w 100%, by zdobyć następny certyfikat.
      </p>
    </div>
  );
}
