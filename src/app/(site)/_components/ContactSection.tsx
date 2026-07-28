"use client";

import React, { useState } from "react";
import {
  Phone,
  EnvelopeSimple,
  MapPin,
  FacebookLogo,
  InstagramLogo,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { SOCIAL_LINKS, GOOGLE_MAPS_URL } from "@/lib/seo/site";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
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

const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

type Status = "idle" | "loading" | "success" | "duplicate" | "error";

export function ContactSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.status === 409) {
        setStatus("duplicate");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="kontakt" className="-mb-60 overflow-hidden scroll-mt-28">
      <motion.div
        className="container mx-auto px-4 max-[1024px]:px-6 flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* === NAGŁÓWEK === */}
        <motion.div
          variants={fadeUpVariants}
          className="w-full flex justify-start mb-10 max-[1024px]:mb-12"
        >
          <h2 className="font-jakarta font-semibold text-brand-secondary text-[48px] max-[1024px]:text-[36px] leading-[110%]">
            Czekamy na Ciebie w{" "}
            <span className="text-[#287D88]">Prudniku.</span>
          </h2>
        </motion.div>

        {/* === GŁÓWNA KARTA === */}
        <motion.div
          variants={scaleUpVariants}
          className="w-full bg-[#7CAEB2] rounded-[64px] max-[1024px]:rounded-[40px] p-12 max-[1024px]:p-6 relative overflow-hidden shadow-lg"
        >
          {/* Ozdobne fale w tle */}
          <div className="absolute -bottom-120 -right-40 w-[800px] h-[800px] rounded-full border-120 border-brand-primary/50 z-0 transition-transform duration-500 hover:scale-110" />
          <div className="absolute -bottom-10 -left-120 w-[800px] h-[800px] rounded-full border-120 border-brand-primary/50 z-0 transition-transform duration-500 hover:scale-110" />
          <div className="absolute -top-80 -right-60 w-[800px] h-[800px] rounded-full border-120 border-brand-primary/50 z-0 transition-transform duration-500 hover:scale-110" />

          {/* --- TOP: MAPA I DANE KONTAKTOWE --- */}
          <div className="relative flex flex-col min-[901px]:flex-row mb-24 max-[900px]:mb-16 z-10 w-full min-[901px]:h-[580px]">
            {/* MAPA */}
            <div className="w-[70%] max-[900px]:w-full h-full max-[900px]:h-[350px] rounded-[32px] overflow-hidden shadow-md bg-white">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2551.46467335967!2d17.57469341572528!3d50.31976097945763!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4711eb6a33719b67%3A0xc32c943df4cb3e7a!2sPiastowska%2030%2C%2048-200%20Prudnik!5e0!3m2!1spl!2spl!4v1700000000000!5m2!1spl!2spl"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale-[20%] contrast-[95%] opacity-90"
              ></iframe>
            </div>

            {/* KARTA KONTAKTOWA */}
            <motion.div
              variants={fadeUpVariants}
              className="w-[450px] max-[1024px]:w-[400px] max-[900px]:w-full bg-brand-primary rounded-[48px] max-[900px]:rounded-[32px] p-10 max-[1024px]:p-8 max-[900px]:p-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)] relative z-20 mt-[-60px] min-[901px]:mt-0 min-[901px]:absolute min-[901px]:right-0 min-[901px]:top-1/2 min-[901px]:-translate-y-1/2 mx-auto min-[901px]:mx-0 max-[900px]:max-w-[500px]"
            >
              <h3 className="font-jakarta font-semibold text-white text-[32px] max-[1024px]:text-[28px] leading-tight mb-0.5">
                Masz pytania?
              </h3>
              <p className="font-montserrat text-white text-[16px] max-[1024px]:text-[14px] mb-8 font-regular">
                Skontaktuj się z nami
              </p>

              {/* Lista kontaktów */}
              <div className="flex flex-col gap-4 max-[1024px]:gap-3 mb-10 max-[1024px]:mb-8">
                {/* Telefon */}
                <div className="flex items-center gap-4 bg-white/15 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-[#3d919a] transition-colors cursor-pointer">
                  <Phone
                    size={32}
                    weight="regular"
                    className="text-white shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-montserrat text-white font-bold text-[14px] max-[1024px]:text-[12px] leading-tight">
                      Telefon
                    </span>
                    <a
                      href="tel:+48693537543"
                      className="font-montserrat text-white text-[16px] max-[1024px]:text-[14px] font-regular mt-0.5"
                    >
                      +48 693 537 543
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-4 bg-white/15 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-[#3d919a] transition-colors cursor-pointer">
                  <EnvelopeSimple
                    size={32}
                    weight="regular"
                    className="text-white shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-montserrat text-white font-bold text-[14px] max-[1024px]:text-[12px] leading-tight">
                      Email
                    </span>
                    <a
                      href="mailto:piotrsiemaszko.fizjo@gmail.com"
                      className="font-montserrat text-white text-[16px] max-[1024px]:text-[14px] font-regular mt-0.5 break-all"
                    >
                      piotrsiemaszko.fizjo@gmail.com
                    </a>
                  </div>
                </div>

                {/* Adres */}
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Otwórz adres w Google Maps"
                  className="flex items-center gap-4 bg-white/15 rounded-[24px] px-6 py-4 max-[1024px]:p-4 hover:bg-[#3d919a] transition-colors cursor-pointer"
                >
                  <MapPin
                    size={32}
                    weight="regular"
                    className="text-white shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-montserrat text-white font-bold text-[14px] max-[1024px]:text-[12px] leading-tight">
                      Adres
                    </span>
                    <span className="font-montserrat text-white text-[16px] max-[1024px]:text-[14px] font-regular mt-0.5">
                      Piastowska 30, Prudnik, Poland, 48-200
                    </span>
                  </div>
                </a>
              </div>

              <div className="w-full h-[1px] bg-white/15 mb-6" />

              {/* Social Media */}
              <div>
                <span className="font-montserrat font-semibold text-white text-[16px] mb-4 block">
                  Połącz się z nami
                </span>
                <div className="flex items-center justify-around">
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#1b646c] transition-all"
                  >
                    <FacebookLogo size={38} weight="light" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#1b646c] transition-all"
                  >
                    <InstagramLogo size={38} weight="light" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.booksy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 max-[1024px]:w-10 max-[1024px]:h-10 rounded-full flex items-center justify-center text-white hover:bg-white transition-all group"
                    aria-label="Booksy"
                  >
                    <Image
                      src="/logotypy/booksy-logotype-white.svg"
                      alt="Booksy"
                      width={38}
                      height={38}
                      className="transition-all duration-300 group-hover:brightness-0 group-hover:invert-[0.3]"
                    />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>

          {/* --- BOTTOM: NEWSLETTER --- */}
          <motion.div
            variants={fadeUpVariants}
            className="relative z-10 flex flex-col items-center text-center max-w-[800px] mx-auto text-white"
          >
            <h3 className="font-jakarta font-semibold text-[48px] max-[1024px]:text-[36px] mb-4 drop-shadow-sm">
              Newsletter
            </h3>
            <p className="font-montserrat text-[16px] max-[1024px]:text-[14px] leading-[160%] text-white/90 mb-8 max-w-[700px]">
              Zostaw swój e-mail i otrzymuj od nas sprawdzone porady zdrowotne,
              powiadomienia o nowych kursach VOD oraz priorytetowy dostęp do
              zapisów na nasze Wydarzenia (zanim ogłosimy je oficjalnie).{" "}
              <br className="max-[768px]:hidden" />
              <span className="font-bold">Zero spamu, sam konkret.</span>
            </p>

            {status === "success" ? (
              <div className="w-full max-w-[500px] py-4 px-6 rounded-[12px] bg-[#1b646c]/30 border border-white/30 text-white font-montserrat text-[16px] text-center">
                Dziękujemy! Jesteś na liście.
              </div>
            ) : (
              <form
                className="w-full max-w-[500px] flex flex-col gap-3"
                onSubmit={handleSubmit}
              >
                <div className="flex max-[600px]:flex-col min-[601px]:flex-row gap-4 max-[1024px]:gap-3">
                  <input
                    type="email"
                    placeholder="Twój adres e-mail"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status !== "idle") setStatus("idle");
                    }}
                    disabled={status === "loading"}
                    className="flex-1 px-6 py-4 max-[1024px]:px-5 max-[1024px]:py-3.5 rounded-[12px] bg-[#E8F0F1] text-brand-secondary font-montserrat text-[16px] max-[1024px]:text-[15px] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1b646c] transition-all disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="px-10 py-4 max-[1024px]:px-8 max-[1024px]:py-3.5 rounded-[12px] bg-[#1b646c] hover:bg-[#154d53] text-white font-montserrat font-semibold text-[16px] max-[1024px]:text-[15px] transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "loading" ? "Zapisuję..." : "Zapisz się"}
                  </button>
                </div>

                {status === "duplicate" && (
                  <p className="font-montserrat text-white/90 text-[14px] text-center">
                    Ten adres jest już na naszej liście.
                  </p>
                )}
                {status === "error" && (
                  <p className="font-montserrat text-white/90 text-[14px] text-center">
                    Coś poszło nie tak. Spróbuj ponownie.
                  </p>
                )}
              </form>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
