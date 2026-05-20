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
  showArrow?: boolean; // Zostawiamy dla kompatybilności wstecznej
  leftIcon?: React.ReactNode; // DODANE: Ikonka przed tekstem
  rightIcon?: React.ReactNode; // Ikonka za tekstem
  href?: string;
  newTab?: boolean;
  disabled?: boolean;
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
      leftIcon, // DODANE: Wyciągnięcie z propsów
      rightIcon,
      href,
      newTab,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    // Określamy, czy przycisk jest zablokowany (ręcznie wyłączony lub w trakcie ładowania)
    const isDisabled = disabled || isLoading;

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
        "relative inline-flex items-center justify-center h-[43px] overflow-hidden",
        "font-montserrat font-medium text-[15px] transition-colors",
        "rounded-tl-[24px] rounded-tr-[2px] rounded-br-[24px] rounded-bl-[24px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
        {
          "bg-brand-primary text-white hover:bg-brand-primary/90":
            variant === "primary" && !isDisabled,
          "bg-brand-secondary text-white hover:bg-brand-secondary/90":
            variant === "secondary" && !isDisabled,

          // STYLE DLA STANU DISABLED
          "opacity-50 pointer-events-none cursor-not-allowed": disabled,
          "pointer-events-none": isLoading, // Tylko blokada kliknięcia, bez opacity przy samym loaderze

          // Trzymamy bazowe kolory, żeby po zablokowaniu nie stracił tła
          "bg-brand-primary text-white": variant === "primary" && isDisabled,
          "bg-brand-secondary text-white":
            variant === "secondary" && isDisabled,
        },
        // Jeśli nie jest zablokowany, ustawiamy cursor-pointer
        !isDisabled && "cursor-pointer",
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
          className="flex items-center justify-center whitespace-nowrap"
        >
          {/* DODANE: Renderowanie opcjonalnej ikonki po lewej stronie tekstu */}
          {leftIcon && (
            <span className="flex items-center justify-center mr-2">
              {leftIcon}
            </span>
          )}

          {/* Tekst przycisku */}
          <span>{children}</span>

          {/* Renderowanie opcjonalnej customowej ikonki po prawej */}
          {rightIcon && !showArrow && (
            <span className="flex items-center justify-center ml-2">
              {rightIcon}
            </span>
          )}

          {/* Zostawiamy starą logikę strzałki */}
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
          // Dodajemy ręczne blokowanie kliknięcia na linku dla pewności
          aria-disabled={isDisabled}
          tabIndex={isDisabled ? -1 : undefined}
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
        disabled={isDisabled}
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
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary ml-2"
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
