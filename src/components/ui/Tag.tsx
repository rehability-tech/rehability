import React from "react";

export const Tag = ({ label }: { label: string }) => {
  return (
    <div className="inline-block px-5 py-1.5 rounded-full bg-brand-primary/90 text-white font-montserrat text-[12px] font-bold tracking-wider mb-3 max-[640px]:self-center uppercase">
      {label}
    </div>
  );
};
