"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

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
  const path = usePathname();

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
  const currentPathname = path.split("/");

  const isGabinetRoute =
    path === "/gabinet" ||
    path === "/campy" ||
    path === `/campy/${currentPathname[2]}`;

  return (
    <header className={`absolute top-0 left-0 right-0 z-50 w-full py-4`}>
      <div
        className={`container flex items-center justify-between ${
          isGabinetRoute &&
          "bg-white/70 py-3 px-6 rounded-full backdrop-blur-2xl"
        } `}
      >
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

        {/* === NAWIGACJA DESKTOP === */}
        <nav className="hidden md:flex items-center gap-6">
          <ul className="flex items-center gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = path === link.href;

              return (
                <li
                  key={link.href}
                  className="relative flex flex-col items-center justify-center px-1 py-2"
                >
                  <Link
                    href={link.href}
                    className={`relative z-10 typography-paragraph transition-colors focus-visible:outline-none ${
                      isActive
                        ? "text-[#0B3B4C] font-semibold"
                        : "text-gray-500 hover:text-[#0B3B4C] font-medium"
                    }`}
                  >
                    {link.label}
                  </Link>

                  {/* Nowy wskaźnik aktywnej zakładki - krótka linia */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-1 h-[3px] w-5 bg-[#0B3B4C] rounded-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:block">
          <Button variant="primary" isLoading={isPending} href="/logowanie">
            Platforma VOD
          </Button>
        </div>

        {/* === PRZYCISK MENU MOBILE === */}
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

      {/* === NAWIGACJA MOBILE (MENU ROZWIJANE) === */}
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
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => {
                  const isActive = path === link.href;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between font-montserrat text-[18px] py-3 px-4 rounded-xl transition-all ${
                        isActive
                          ? "bg-brand-primary text-white font-bold shadow-md"
                          : "text-brand-secondary font-medium hover:bg-gray-50"
                      }`}
                    >
                      {link.label}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className={isActive ? "text-white" : "text-gray-400"}
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
                  );
                })}

                {/* Link VOD */}
                <Link
                  href={"/panel-kursanta"}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between font-montserrat text-[18px] text-brand-primary py-3 px-4 font-semibold mt-4 border-t border-gray-100"
                >
                  Platforma VOD
                  <div className="flex items-center justify-center rounded-full -mr-1 h-8 w-8 bg-brand-primary shadow-sm">
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

            <div className="mt-auto pt-8 pb-4 flex items-center justify-between text-[14px] font-montserrat font-medium text-gray-400 px-4">
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
