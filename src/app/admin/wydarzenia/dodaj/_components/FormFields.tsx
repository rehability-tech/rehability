"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePlacesWidget } from "react-google-autocomplete";
import DatePicker, { DatePickerProps } from "react-datepicker";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react/dist/ssr";
interface CustomDatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void; // Sztywno ustalamy, że to pojedyncza data
  icon?: React.ReactNode;
  placeholderText?: string;
  minDate?: Date;
  disabled?: boolean;
  // [key: string]: any pozwala nam w locie przekazywać do DatePickera inne, dowolne propsy
  // bez konieczności walki z jego skomplikowanymi definicjami typów.
  [key: string]: any;
}
// ==========================================
// 1. KOMPONENT ŁADOWANIA AI (STAŁY GLOW + DELIKATNY SHIMMER)
// ==========================================
function AiInputLoader({ isLoading }: { isLoading?: boolean }) {
  // Czas trwania pełnego cyklu animacji
  const shimmerDuration = 2.5;
  // Ilość bloków (smug)
  const numBlocks = 3;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader-main-overlay"
          // Płynne pojawianie się
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          // --- GŁÓWNA WARSTWA (Z-20): KONTROLA KRAWĘDZI I STAŁY GLOW ---
          className={cn(
            "absolute inset-0 z-20 cursor-default rounded-[12px] overflow-hidden",
            // Szklany efekt usunięty, jak w Twoim kodzie
            "",
            // --- STAŁY, SUBTELNY CIEŃ NA ZEWNĄTRZ ---
            "shadow-[0_0_12px_7px_rgba(40,125,136,0.3)]",
          )}
        >
          {/* --- 3 DELIKATNE SHIMMERY W ŚRODKU (ANIMOWANE SMUGI) --- */}
          {[...Array(numBlocks)].map((_, i) => (
            <motion.div
              key={`shimmer-block-${i}`}
              initial={{ left: "-100%" }} // Start przed lewą krawędzią
              animate={{ left: "100%" }} // Koniec za prawą krawędzią
              transition={{
                repeat: Infinity,
                duration: shimmerDuration,
                ease: "linear",
                // Przesunięcie w czasie każdej kolejnej smugi
                delay: i * (shimmerDuration / numBlocks),
              }}
              // Zmieniona szerokość na 60%, żeby smugi miały między sobą odstęp
              className="absolute top-0 bottom-0 w-[60%] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent"
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ==========================================
// 2. STANDARDOWY INPUT (Tekst, Liczby)
// ==========================================
export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  helperText?: string;
  containerClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      icon,
      isLoading,
      helperText,
      containerClassName,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
          {label} {required && <span className="text-brand-primary">*</span>}
        </label>
        {/* Kontener z-0, żeby warstwy ładowania działały */}
        <div className="relative z-0">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-30">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            // Zablokowany podczas ładowania
            disabled={disabled || isLoading}
            className={cn(
              // Input jest z-10 (między blaskiem cienia a frontalną warstwą skanera)
              "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] pr-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
              icon ? "pl-10" : "pl-4",
              // Styl disabled
              (disabled || isLoading) && "opacity-80 text-gray-500",
            )}
            {...props}
          />
          {/* Komponent ładujący */}
          <AiInputLoader isLoading={isLoading} />
        </div>
        {helperText && (
          <span className="text-xs text-gray-400">{helperText}</span>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

// ==========================================
// 3. TEXTAREA (Długi tekst)
// ==========================================
export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  isLoading?: boolean;
  helperText?: string;
  containerClassName?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      isLoading,
      helperText,
      containerClassName,
      required,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
          {label} {required && <span className="text-brand-primary">*</span>}
        </label>
        <div className="relative z-0">
          <textarea
            ref={ref}
            disabled={disabled || isLoading}
            rows={5}
            className={cn(
              "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] px-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors resize-y min-h-[120px]",
              (disabled || isLoading) && "opacity-80 text-gray-500",
            )}
            {...props}
          />
          <AiInputLoader isLoading={isLoading} />
        </div>
        {helperText && (
          <span className="text-xs text-gray-400">{helperText}</span>
        )}
      </div>
    );
  },
);
FormTextarea.displayName = "FormTextarea";

// ==========================================
// 3b. SELECT (lista rozwijana) — z tym samym shimmerem ładowania AI
// ==========================================
export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  helperText?: string;
  containerClassName?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      icon,
      isLoading,
      helperText,
      containerClassName,
      required,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
            {label} {required && <span className="text-brand-primary">*</span>}
          </label>
        )}
        <div className="relative z-0">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-30">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
              // appearance-none — natywną strzałkę zastępujemy własnym chevronem
              "relative z-10 w-full appearance-none bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] pr-11 py-3 font-montserrat font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
              icon ? "pl-10" : "pl-4",
              (disabled || isLoading) && "opacity-80 text-gray-500",
            )}
            {...props}
          >
            {children}
          </select>
          {/* Własny chevron */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 text-brand-primary pointer-events-none">
            <CaretDown size={16} weight="bold" />
          </div>
          <AiInputLoader isLoading={isLoading} />
        </div>
        {helperText && (
          <span className="text-xs text-gray-400">{helperText}</span>
        )}
      </div>
    );
  },
);
FormSelect.displayName = "FormSelect";

// ==========================================
// 4. INPUT LOKALIZACJI (Google Autocomplete)
// ==========================================
export interface FormLocationInputProps {
  label: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  helperText?: string;
  required?: boolean;
  containerClassName?: string;
  defaultValue?: string;
  onPlaceSelected: (place: any) => void;
  placeholder?: string;
}

export function FormLocationInput({
  label,
  icon,
  isLoading,
  helperText,
  required,
  containerClassName,
  defaultValue,
  onPlaceSelected,
  placeholder,
}: FormLocationInputProps) {
  const { ref } = usePlacesWidget<HTMLInputElement>({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    onPlaceSelected,
    options: {
      types: ["establishment", "geocode"],
      componentRestrictions: { country: "pl" },
    },
  });

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
        {label} {required && <span className="text-brand-primary">*</span>}
      </label>
      <div className="relative z-0">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-30">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          defaultValue={defaultValue}
          disabled={isLoading}
          autoComplete="off"
          className={cn(
            "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] pr-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
            icon ? "pl-10" : "pl-4",
            isLoading && "opacity-80 text-gray-500",
          )}
        />
        <AiInputLoader isLoading={isLoading} />
      </div>
      {helperText && (
        <span className="text-xs text-gray-400">{helperText}</span>
      )}
    </div>
  );
}

// ==========================================
// 4. INPUT DATY (React DatePicker)
// ==========================================
export interface FormDatePickerProps extends Omit<DatePickerProps, "onChange"> {
  label: string;
  isLoading?: boolean;
  required?: boolean;
  containerClassName?: string;
  helperText?: string;
  onChange: (date: Date | null) => void;
}

export function FormDatePicker({
  label,
  isLoading,
  required,
  containerClassName,
  helperText,
  onChange,
  ...props
}: CustomDatePickerProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      <label className="text-sm font-semibold text-[#0B3B4C] font-montserrat">
        {label} {required && <span className="text-brand-primary">*</span>}
      </label>
      <div className="relative z-0">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 z-30">
          <CalendarBlank size={18} />
        </div>
        <DatePicker
          onChange={onChange}
          locale="pl"
          dateFormat="dd MMMM yyyy"
          autoComplete="off"
          disabled={isLoading}
          // Kalendarz renderujemy w portalu do <body>, by wyrwać go ze stacking-
          // contextu pola (wrapper ma `relative z-0`) — inaczej kolejne inputy
          // poniżej przykrywały popper. Wysoki z-index trzyma go nad resztą UI.
          portalId="datepicker-portal"
          popperClassName="!z-[9999]"
          className={cn(
            "relative z-10 w-full bg-gray-50 border border-gray-200 text-[#0B3B4C] text-sm rounded-[12px] pl-10 pr-4 py-3 font-montserrat focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-colors",
            isLoading
              ? "cursor-default opacity-80 text-gray-500"
              : "cursor-pointer",
          )}
          wrapperClassName="w-full"
          {...props}
        />
        <AiInputLoader isLoading={isLoading} />
      </div>
      {helperText && (
        <span className="text-xs text-gray-400 leading-relaxed">
          {helperText}
        </span>
      )}
    </div>
  );
}
