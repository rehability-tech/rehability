"use client";

import React from "react";
import { motion } from "framer-motion";

import SingleTripHero from "./SingleTripHero";
import TripBookingForm, { type CurrentUser } from "./TripBookingForm";
import BlockRenderer from "@/components/block-renderer/BlockRenderer";

interface TripPageClientProps {
  tripId: string;
  title: string;
  subtitle: string;
  tags: string[];
  heroImage: string;
  location?: string;
  dateRange?: string;
  price?: string;
  priceValue: number;
  depositValue: number;
  allowBringFriend: boolean;
  blocks: any[];
  mapUrl?: string | null;
  currentUser: CurrentUser | null;
  initialVariant?: "standard" | "duo";
  initialStep?: number;
}

export default function TripPageClient({
  tripId,
  title,
  subtitle,
  tags,
  heroImage,
  location,
  dateRange,
  price,
  priceValue,
  depositValue,
  allowBringFriend,
  blocks,
  mapUrl,
  currentUser,
  initialVariant,
  initialStep,
}: TripPageClientProps) {
  return (
    <main className="min-h-screen bg-[#FDFDFD] pb-24 font-montserrat">
      <SingleTripHero
        title={title}
        subtitle={subtitle}
        tags={tags}
        heroImage={heroImage}
        location={location}
        dateRange={dateRange}
        price={price}
      />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
        <motion.div
          key="info"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-[1200px] w-full flex flex-col text-left mx-auto"
        >
          <BlockRenderer blocks={blocks} mapUrl={mapUrl} />

          <div className="mt-16 pt-8 border-t border-gray-100">
            <TripBookingForm
              tripId={tripId}
              tripTitle={title}
              price={priceValue}
              deposit={depositValue}
              allowBringFriend={allowBringFriend}
              currentUser={currentUser}
              initialVariant={initialVariant}
              initialStep={initialStep}
            />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
