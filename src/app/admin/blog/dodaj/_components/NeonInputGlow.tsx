"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  isLoading?: boolean;
  /** Border radius of the underlying input. Defaults to 12px to match form fields. */
  radiusClass?: string;
}

/**
 * Overlay that gives a target input/textarea/select the same neon AI shimmer
 * used by FormFields' AiInputLoader. Drop into a `relative z-0` container so it
 * sits above the field.
 */
export default function NeonInputGlow({
  isLoading,
  radiusClass = "rounded-[12px]",
}: Props) {
  const shimmerDuration = 2.5;
  const numBlocks = 3;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="neon-input-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 z-20 cursor-default overflow-hidden pointer-events-none",
            radiusClass,
            "shadow-[0_0_12px_7px_rgba(40,125,136,0.3)]",
          )}
        >
          {[...Array(numBlocks)].map((_, i) => (
            <motion.div
              key={`shimmer-${i}`}
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{
                repeat: Infinity,
                duration: shimmerDuration,
                ease: "linear",
                delay: i * (shimmerDuration / numBlocks),
              }}
              className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
