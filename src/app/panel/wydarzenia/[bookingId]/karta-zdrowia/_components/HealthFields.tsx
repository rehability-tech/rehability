"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col mb-5 shrink-0">
      <div className="w-10 h-10 rounded-[14px] bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
        {icon}
      </div>
      <h2 className="font-jakarta font-bold text-xl text-brand-secondary">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12.5px] text-brand-secondary/60 mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4 shrink-0">
      <label className="block text-[12.5px] font-bold text-brand-secondary/70 mb-1.5 ml-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={cn(
          "w-full rounded-[14px] border-2 border-transparent bg-gray-50/80 px-3.5 py-2.5 text-[13px] text-brand-secondary placeholder-brand-secondary/30",
          "focus:bg-white focus:border-brand-primary/20 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:shadow-[0_4px_20px_-5px_rgba(40,125,136,0.15)]",
          "transition-all duration-300 resize-none",
        )}
      />
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="mb-4 shrink-0">
      <label className="block text-[12.5px] font-bold text-brand-secondary/70 mb-1.5 ml-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-[14px] border-2 border-transparent bg-gray-50/80 px-3.5 py-2.5 text-[13px] text-brand-secondary placeholder-brand-secondary/30",
          "focus:bg-white focus:border-brand-primary/20 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:shadow-[0_4px_20px_-5px_rgba(40,125,136,0.15)]",
          "transition-all duration-300",
        )}
      />
    </div>
  );
}

export function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="mb-3">
      <span className="block text-[11px] font-bold text-brand-secondary/50 uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="text-[14px] text-brand-secondary font-medium">
        {value}
      </div>
    </div>
  );
}
