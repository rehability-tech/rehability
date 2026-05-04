/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import Link from "next/link";

// Tworzymy animowaną wersję Next.js Link
const MotionLink = motion(Link);

// Nadpisujemy typ "children", aby uniknąć konfliktu z MotionValue
export interface ButtonProps extends Omit<
  HTMLMotionProps<"button">,
  "children"
> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  showArrow?: boolean;
  href?: string;
  newTab?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      className,
      variant = "primary",
      isLoading = false,
      showArrow,
      href,
      newTab,
      children,
      ...props
    },
    ref,
  ) => {
    // Wyciągamy wspólne właściwości animacji i stylów
    const commonProps = {
      initial: false,
      animate: {
        width: isLoading ? 43 : "auto",
        paddingLeft: isLoading ? 0 : 20,
        paddingRight: isLoading ? 0 : 20,
      },
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        delay: isLoading ? 0.2 : 0,
      },
      className: cn(
        "relative inline-flex items-center justify-center h-[43px] cursor-pointer overflow-hidden",
        "font-montserrat font-medium text-[15px]",
        "rounded-tl-[24px] rounded-tr-[2px] rounded-br-[24px] rounded-bl-[24px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:pointer-events-none disabled:opacity-80",
        {
          "bg-brand-primary text-white hover:bg-brand-primary/90":
            variant === "primary",
          "bg-brand-secondary text-white hover:bg-brand-secondary/90":
            variant === "secondary",
        },
        className,
      ),
    };

    // Zawartość przycisku wydzielona do stałej
    const content = (
      <>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1, delay: 0 } }}
              transition={{ duration: 0.2, delay: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="btn-loader" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{
            duration: 0.2,
            delay: isLoading ? 0 : 0.3,
          }}
          className="flex items-center justify-center gap-[16px] whitespace-nowrap"
        >
          <span>{children}</span>
          {showArrow && <ArrowIcon />}
        </motion.div>
      </>
    );

    // Jeśli podano href, renderujemy Link
    if (href) {
      return (
        <MotionLink
          href={href}
          ref={ref as any}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          {...commonProps}
          {...(props as any)}
        >
          {content}
        </MotionLink>
      );
    }

    // Jeśli brakuje href, renderujemy zwykły przycisk
    return (
      <motion.button
        ref={ref as any}
        disabled={isLoading || props.disabled}
        {...commonProps}
        {...(props as any)}
      >
        {content}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

function ArrowIcon() {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary"
      aria-hidden="true"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 11L11 1M11 1H3.5M11 1V8.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
