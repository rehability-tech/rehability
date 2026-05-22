"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type BookingMode = "solo" | "duo";

interface BookingContextValue {
  isOpen: boolean;
  mode: BookingMode;
  openSheet: (mode?: BookingMode) => void;
  closeSheet: () => void;
  setMode: (mode: BookingMode) => void;
  allowDuo: boolean;
}

const BookingContext = createContext<BookingContextValue | null>(null);

interface BookingProviderProps {
  allowDuo: boolean;
  defaultMode?: BookingMode;
  children: React.ReactNode;
}

export function BookingProvider({
  allowDuo,
  defaultMode = "solo",
  children,
}: BookingProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<BookingMode>(defaultMode);

  const openSheet = useCallback(
    (next?: BookingMode) => {
      if (next) {
        setMode(allowDuo ? next : "solo");
      } else if (!allowDuo) {
        setMode("solo");
      }
      setIsOpen(true);
    },
    [allowDuo],
  );

  const closeSheet = useCallback(() => setIsOpen(false), []);

  const value = useMemo<BookingContextValue>(
    () => ({
      isOpen,
      mode,
      openSheet,
      closeSheet,
      setMode: (m) => setMode(allowDuo ? m : "solo"),
      allowDuo,
    }),
    [isOpen, mode, openSheet, closeSheet, allowDuo],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx)
    throw new Error("useBooking must be used inside a <BookingProvider />");
  return ctx;
}
