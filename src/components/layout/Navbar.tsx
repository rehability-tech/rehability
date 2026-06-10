"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import {
  CaretDown,
  SignOut,
  SquaresFour,
  User as UserIcon,
  MonitorPlay, // Nowa ikona dla VOD
  Tent, // Nowa ikona dla Wyjazdów (lub użyj MapTrifold/CalendarBlank)
  Lock,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { label: "Start", href: "/" },
  { label: "O nas", href: "/o-nas" },
  { label: "Gabinet", href: "/gabinet" },
  { label: "Wyjazdy", href: "/wyjazdy" },
  { label: "Kursy", href: "/kursy" },
  { label: "Blog", href: "/blog" },
];

interface NavbarProps {
  session: Session | null;
}
const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.15,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.1 },
  },
};
export function Navbar({ session }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Portal renderuje się dopiero po zamontowaniu (document.body niedostępny w SSR).
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const path = usePathname();

  // Sticky navbar: przezroczysty na górze → szklany pasek po przewinięciu.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  // Blokowanie scrolla przy otwartym menu mobilnym
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  // Zamykanie dropdowna po kliknięciu poza nim (desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPathname = path.split("/");
  const isGabinetRoute =
    path === "/gabinet" ||
    path === "/wyjazdy" ||
    path === "/kursy" ||
    path === `/wyjazdy/${currentPathname[2]}` ||
    path === `/blog/${currentPathname[2]}`;

  // Ustalanie uprawnień i linków na podstawie roli
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  // Upewnij się, że TypeScript poprawnie mapuje role w Session, jeśli nie to użyj "as jakistyp"
  const dashboardLink =
    (session?.user as any)?.role === "ADMIN" ? "/admin" : "/panel";
  const isLogowanie = path === "/logowanie";

  return (
    <header
      className={`top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        isLogowanie
          ? "block py-4"
          : `fixed ${
              scrolled
                ? "py-2.5 bg-white/80 backdrop-blur-2xl border-b border-white/40 shadow-[0_4px_24px_rgba(3,63,99,0.08)]"
                : "py-4 bg-transparent"
            }`
      }`}
    >
      <div
        className={`container flex items-center justify-between ${
          isGabinetRoute && !scrolled
            ? "bg-white/70 py-3 px-6 rounded-full backdrop-blur-2xl shadow-sm"
            : ""
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

                  {/* Wskaźnik aktywnej zakładki */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-1 h-[3px] w-5 bg-brand-primary rounded-full"
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

        {/* === KONTO / LOGOWANIE DESKTOP === */}
        <div className="hidden md:block relative z-[101]" ref={dropdownRef}>
          {session ? (
            // DROPDOWN DLA ZALOGOWANEGO UŻYTKOWNIKA
            // DROPDOWN DLA ZALOGOWANEGO UŻYTKOWNIKA
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-tl-full rounded-bl-full rounded-br-full rounded-tr-[4px] hover:border-brand-primary/50 transition-all shadow-sm focus-visible:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary overflow-hidden">
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Avatar"
                      width={28}
                      height={28}
                    />
                  ) : (
                    <UserIcon size={16} weight="bold" />
                  )}
                </div>
                <span className="text-sm font-semibold text-[#0B3B4C] truncate max-w-[120px]">
                  {session.user?.name || "Moje konto"}
                </span>
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`text-gray-400 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    variants={dropdownVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-tl-[24px] rounded-bl-[24px] rounded-br-[24px] rounded-tr-[4px] overflow-hidden flex flex-col p-2"
                  >
                    {/* Główny Panel */}
                    <motion.div variants={itemVariants}>
                      <Link
                        href={dashboardLink}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-sm font-semibold text-[#0B3B4C] hover:bg-brand-primary/5 transition-colors"
                      >
                        <SquaresFour
                          size={20}
                          weight="duotone"
                          className="text-brand-primary"
                        />
                        {(session.user as any)?.role === "ADMIN"
                          ? "Panel Administratora"
                          : "Główny Panel"}
                      </Link>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="h-px bg-gray-100 my-1 mx-3"
                    />

                    {/* Platforma VOD — w budowie, zablokowana (brak nawigacji) */}
                    <motion.div variants={itemVariants}>
                      <div
                        aria-disabled="true"
                        title="Platforma VOD jest w budowie"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-gray-400 cursor-not-allowed select-none"
                      >
                        <span className="relative flex items-center justify-center shrink-0">
                          <MonitorPlay size={18} />
                          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-gray-400 flex items-center justify-center">
                            <Lock size={8} weight="fill" className="text-white" />
                          </span>
                        </span>
                        Platforma VOD
                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-gray-400">
                          W budowie
                        </span>
                      </div>
                    </motion.div>

                    {/* Wyjazdy */}
                    <motion.div variants={itemVariants}>
                      <Link
                        // Jeśli admin -> /admin/wyjazdy, w przeciwnym razie -> /moje-campy
                        href={isAdmin ? "/admin/wyjazdy" : "/moje-campy"}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-brand-primary transition-colors"
                      >
                        <Tent size={18} />
                        {isAdmin ? "Wyjazdy" : "Moje Wyjazdy"}
                      </Link>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="h-px bg-gray-100 my-1 mx-3"
                    />

                    {/* Wyloguj */}
                    <motion.div variants={itemVariants}>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left mt-1 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {isLoggingOut ? (
                          <>
                            <CircleNotch size={18} className="animate-spin" />
                            Wylogowywanie…
                          </>
                        ) : (
                          <>
                            <SignOut size={18} />
                            Wyloguj się
                          </>
                        )}
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            // PRZYCISK LOGOWANIA (NIEZALOGOWANY)
            <Button variant="primary" href="/panel">
              Twój panel
            </Button>
          )}
        </div>

        {/* === PRZYCISK MENU MOBILE === */}
        <button
          className={`md:hidden flex flex-col justify-center items-center w-12 h-12 gap-1.5 z-[101] bg-brand-primary rounded-tl-full rounded-bl-full rounded-br-full rounded-tr-[2px] shadow-sm transition-all hover:bg-brand-primary/90 ${
            isMobileMenuOpen ? "opacity-0 pointer-events-none" : ""
          }`}
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

      {/* === NAWIGACJA MOBILE (MENU ROZWIJANE) ===
          Renderowane przez portal do <body>, aby wyrwać menu ze stacking-contextu
          <header> (na podstronach fixed z-50). Bez tego pozycjonowana treść strony
          — np. karta logowania — potrafiła wychodzić ponad menu. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] flex flex-col bg-white px-6 py-4 md:hidden overflow-y-auto"
              >
            {/* Przycisk zamykania — w portalu, bo hamburger w <header> jest pod
                menu (header fixed z-50 < portal z-100). */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Zamknij menu"
              className="absolute top-4 right-6 flex flex-col justify-center items-center w-12 h-12 z-[110] bg-brand-primary rounded-tl-full rounded-bl-full rounded-br-full rounded-tr-[2px] shadow-sm transition-all hover:bg-brand-primary/90"
            >
              <span className="absolute w-6 h-[2px] bg-white rounded-full rotate-45" />
              <span className="absolute w-6 h-[2px] bg-white rounded-full -rotate-45" />
            </button>

            <div className="mt-24 flex flex-col flex-1">
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
              </nav>

              {/* Sekcja konta na telefonie na samym dole menu */}
              <div className="mt-auto mb-4 border-t border-gray-100 pt-6 flex flex-col gap-3">
                {session ? (
                  <>
                    <div className="flex items-center gap-3 px-2 mb-2">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        {session.user?.image ? (
                          <Image
                            src={session.user.image}
                            alt="Avatar"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        ) : (
                          <UserIcon size={20} weight="bold" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[14px] text-gray-500 font-medium">
                          Zalogowano jako:
                        </span>
                        <span className="text-[16px] font-bold text-[#0B3B4C]">
                          {session.user?.name || "Użytkownik"}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={dashboardLink}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 font-montserrat text-[16px] bg-brand-primary text-white py-3.5 px-4 font-bold rounded-xl shadow-md transition-all hover:bg-[#0B3B4C]/90"
                    >
                      <SquaresFour size={20} />
                      Przejdź do Panelu
                    </Link>

                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex items-center justify-center gap-2 font-montserrat text-[16px] bg-brand-primary/20 text-brand-primary py-3.5 px-4 font-bold rounded-xl transition-all hover:bg-red-100 disabled:opacity-70 disabled:cursor-wait"
                    >
                      {isLoggingOut ? (
                        <>
                          <CircleNotch size={20} className="animate-spin" />
                          Wylogowywanie…
                        </>
                      ) : (
                        <>
                          <SignOut size={20} />
                          Wyloguj się
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/panel"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between font-montserrat text-[18px] text-brand-primary py-3 px-4 font-semibold border-2 border-brand-primary/20 bg-brand-primary/5 rounded-xl transition-all hover:bg-brand-primary/10"
                  >
                    Twój panel
                    <div className="flex items-center justify-center rounded-full h-8 w-8 bg-brand-primary shadow-sm">
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
                )}
              </div>
            </div>

            <div className="pb-4 flex items-center justify-between text-[14px] font-montserrat font-medium text-gray-400 px-4">
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
          </AnimatePresence>,
          document.body,
        )}
    </header>
  );
}
