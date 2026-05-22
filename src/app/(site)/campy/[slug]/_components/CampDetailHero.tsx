"use client";

import React from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  CalendarBlank,
  MapPin,
  Users,
  Eye,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

interface Props {
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
  location: string;
  dateRange: string;
  freeSeats: number;
  capacity: number;
  views: number;
}

export default function CampDetailHero({
  title,
  subtitle,
  tags,
  heroImage,
  location,
  dateRange,
  freeSeats,
  capacity,
  views,
}: Props) {
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], [0, 120]);
  const imgScale = useTransform(scrollY, [0, 600], [1, 1.1]);
  const overlayOpacity = useTransform(scrollY, [0, 600], [0.4, 0.7]);

  return (
    <section className="relative w-full h-[70vh] min-h-[520px] lg:min-h-[640px] overflow-hidden">
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-0 will-change-transform"
      >
        <Image
          src={heroImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-brand-secondary/30 via-brand-secondary/60 to-brand-secondary/95"
      />

      <div className="relative h-full container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 lg:pb-20">
        {tags && tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-5"
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-jakarta font-bold text-white text-[36px] md:text-[56px] lg:text-[64px] leading-[1.05] max-w-4xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-white/85 text-[15px] md:text-[18px] max-w-2xl mt-4 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 max-w-3xl"
        >
          <InfoChip icon={<CalendarBlank size={18} weight="duotone" />}>
            {dateRange}
          </InfoChip>
          <InfoChip icon={<MapPin size={18} weight="duotone" />}>
            {location}
          </InfoChip>
          <InfoChip icon={<Users size={18} weight="duotone" />}>
            {freeSeats} / {capacity} wolne miejsca
          </InfoChip>
          <InfoChip icon={<Eye size={18} weight="duotone" />}>
            {views.toLocaleString("pl-PL")} wyświetleń
          </InfoChip>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="absolute right-4 sm:right-6 lg:right-8 bottom-14 lg:bottom-20 hidden md:flex items-center gap-1.5 text-white/70 text-[11px] uppercase tracking-[0.2em] font-bold"
        >
          <Sparkle size={14} weight="fill" className="text-brand-yellow" />
          Premium Wellness · Rehability
        </motion.div>
      </div>
    </section>
  );
}

function InfoChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/20 text-white text-[13px] font-semibold">
      <span className="text-brand-yellow">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}
