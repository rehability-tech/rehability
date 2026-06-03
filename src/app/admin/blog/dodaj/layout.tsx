import BlogCreatorStepper from "./_components/BlogCreatorStepper";
import React from "react";

export default function BlogCreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 px-3 py-5 sm:p-6">
      <div className="my-8 mt-2 text-center">
        <h1 className="text-[24px] md:text-[28px] font-jakarta font-bold text-[#0B3B4C]">
          Kreator artykułu
        </h1>
        <p className="text-gray-500 font-montserrat text-[14px] md:text-[15px] mt-1">
          Napisz artykuł, zoptymalizuj treść i uzupełnij pola SEO krok po kroku.
        </p>
      </div>

      <div className="min-h-[500px]">
        <BlogCreatorStepper />
        <div className="border-t border-gray-50 pt-8 mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}
