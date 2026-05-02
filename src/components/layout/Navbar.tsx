"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Start", href: "/" },
  { label: "O nas", href: "/o-nas" },
  { label: "Gabinet", href: "/gabinet" },
  { label: "Campy", href: "/campy" },
  { label: "Blog", href: "/blog" },
];

export function Navbar() {
  const [isPending, setIsPending] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleVodClick = async () => {
    setIsPending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full py-4">
      <div className="container flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none z-[101]"
        >
          <Image
            src="/logotypy/logo-primary.svg"
            alt="Rehability Logo"
            width={130}
            height={39}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="typography-paragraph text-brand-secondary hover:text-brand-primary transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button
            variant="primary"
            isLoading={isPending}
            onClick={handleVodClick}
          >
            Platforma VOD
          </Button>
        </div>

        {/* PRZYCISK MENU - KSZTAŁT KROPLI */}
        <button
          className="md:hidden flex flex-col justify-center items-center w-12 h-12 gap-1.5 z-[101] bg-brand-primary rounded-tl-full rounded-bl-full rounded-br-full rounded-tr-[2px] shadow-sm transition-all hover:bg-brand-primary/90"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <motion.span
            animate={{
              rotate: isMobileMenuOpen ? 45 : 0,
              y: isMobileMenuOpen ? 8 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="w-6 h-[2px] bg-white rounded-full origin-center"
          />
          <motion.span
            animate={{
              opacity: isMobileMenuOpen ? 0 : 1,
              width: isMobileMenuOpen ? "24px" : "16px",
            }}
            transition={{ duration: 0.3 }}
            className="h-[2px] bg-white rounded-full"
          />
          <motion.span
            animate={{
              rotate: isMobileMenuOpen ? -45 : 0,
              y: isMobileMenuOpen ? -8 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="w-6 h-[2px] bg-white rounded-full origin-center"
          />
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] flex flex-col bg-white px-6 py-4 md:hidden overflow-y-auto"
          >
            <div className="mt-20 flex flex-col flex-1">
              <nav className="flex flex-col gap-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between font-montserrat font-medium text-[18px] text-brand-secondary py-2"
                  >
                    {link.label}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-gray-400"
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ))}

                <Link
                  href={"/panel-kursanta"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between font-montserrat text-[18px] text-brand-primary py-2 font-semibold"
                >
                  Platforma VOD
                  <div className="flex items-center justify-center rounded-full -mr-1 h-8 w-8 bg-brand-primary">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-white"
                    >
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              </nav>
            </div>

            <div className="mt-auto pt-8 pb-4 flex items-center justify-between text-[14px] font-montserrat font-medium text-gray-400">
              <Link
                href="#"
                className="hover:text-brand-primary transition-colors"
              >
                Facebook
              </Link>
              <Link
                href="#"
                className="hover:text-brand-primary transition-colors"
              >
                Instagram
              </Link>
              <Link
                href="#"
                className="hover:text-brand-primary transition-colors"
              >
                Twitter
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
