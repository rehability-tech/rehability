"use client";

import { motion } from "framer-motion";

export function CardShimmer() {
  return (
    <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] rounded-[20px] overflow-hidden pointer-events-none">
      <motion.div
        className="w-full h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
      />
    </div>
  );
}
