"use client";

import React, { useRef, useEffect, useState } from "react";
import { useDragControls, Reorder, motion } from "framer-motion";
import { CampBlock } from "@/app/admin/campy/dodaj/edytor-tresci/page";
import RichTextInput from "@/components/sections/admin/campy/edytor/helpers/RichTextInput";
import {
  Trash,
  DotsSixVertical,
  Plus,
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  // --- NOWE IKONY HOLISTYCZNE ---
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
  Minus,
  Question,
  List,
} from "@phosphor-icons/react/dist/ssr";
import { Clock, X } from "@phosphor-icons/react";
import { Tooltip } from "@/components/ui/ToolTip"; // Upewnij się, że ścieżka jest poprawna

// Rozszerzona mapa ikon
const ICONS: Record<string, React.ElementType> = {
  CheckCircle,
  Bed,
  ForkKnife,
  Sparkle,
  Person,
  Leaf,
  Gift,
  Heartbeat,
  Brain,
  Drop,
  Mountains,
  Sun,
  HandHeart,
  Campfire,
  Tree,
  Barbell,
};
interface BlockEditorCardProps {
  block: CampBlock;
  onDelete: () => void;
  onUpdate: (updatedBlock: CampBlock) => void;
}
// ----------------------------------------------------------------------
// PODKOMPONENT: DraggableFaqItem
// ----------------------------------------------------------------------
function DraggableFaqItem({
  item,
  index,
  onUpdate,
  onRemove,
  isOpen,
  onToggle,
}: any) {
  const dragControls = useDragControls();
  const formattedNumber = String(index + 1).padStart(2, "0");

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false}
      dragControls={dragControls}
      className={`relative flex flex-col min-[600px]:flex-row min-[600px]:items-start gap-4 min-[600px]:gap-10 py-6 md:py-8 border-b border-[#033F63]/20 group/faq transition-colors w-full bg-white ${
        index === 0 ? "border-t" : ""
      }`}
    >
      {/* MINI TOOLBAR (PRAWY GÓRNY RÓG KARTY FAQ) */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 opacity-0 group-hover/faq:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm">
        <Tooltip content="Przeciągnij by zmienić kolejność" position="top">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors"
          >
            <List size={16} weight="bold" />
          </div>
        </Tooltip>
        <div className="w-px h-3 bg-gray-200 mx-0.5" />
        <Tooltip content="Usuń pytanie" position="top">
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={16} weight="bold" />
          </button>
        </Tooltip>
      </div>

      {/* 1. NUMER I PRZYCISK MOBILE */}
      <div className="flex justify-between items-center w-full min-[600px]:w-auto pt-2">
        <div className="font-jakarta font-bold text-[40px] min-[600px]:text-[48px] min-[600px]:self-center leading-none text-[#0B3B4C] min-[600px]:mt-1">
          {formattedNumber}
        </div>
        <button
          onClick={onToggle}
          className="min-[600px]:hidden w-8 h-8 shrink-0 rounded-full bg-[#287D88] text-white flex items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300"
        >
          <div
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
          >
            {isOpen ? (
              <Minus size={18} weight="bold" />
            ) : (
              <Plus size={18} weight="bold" />
            )}
          </div>
        </button>
      </div>

      {/* 2. TREŚĆ (PYTANIE I ODPOWIEDŹ) */}
      <div className="flex-1 flex flex-col w-full pr-0 md:pr-12">
        {/* INPUT PYTANIA */}
        <textarea
          value={item.question || ""}
          onChange={(e) => onUpdate({ ...item, question: e.target.value })}
          rows={2}
          className={`font-montserrat font-semibold text-[16px] md:text-[18px] leading-[140%] transition-colors duration-300 bg-transparent outline-none border-b border-dashed resize-none overflow-hidden w-full ${
            isOpen
              ? "text-[#287D88] border-[#287D88]/30"
              : "text-[#033F63] hover:text-[#287D88] border-transparent hover:border-[#287D88]/30"
          }`}
          placeholder="Wpisz pytanie..."
        />

        {/* INPUT ODPOWIEDZI (Używa RichTextInput i jest renderowany warunkowo) */}
        {isOpen && (
          <div className="mt-4 pt-4 border-t border-dashed border-[#287D88]/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#287D88]/60 mb-2 block">
              Odpowiedź (możesz pogrubiać i formatować):
            </span>
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200 focus-within:border-[#287D88]/50 focus-within:bg-white transition-colors">
              <RichTextInput
                value={item.answer || ""}
                onChange={(newHtml) => onUpdate({ ...item, answer: newHtml })}
                className="font-montserrat text-[#033F63] text-[14px] md:text-[15px] leading-[1.7] min-h-[80px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. PRZYCISK DESKTOP */}
      <button
        onClick={onToggle}
        className="hidden min-[600px]:flex w-10 h-10 self-center shrink-0 rounded-full bg-[#287D88] text-white items-center justify-center shadow-[0_4px_10px_rgba(40,125,136,0.3)] transition-transform duration-300 mt-1 cursor-pointer hover:scale-105"
      >
        <div
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          {isOpen ? (
            <Minus size={18} weight="bold" />
          ) : (
            <Plus size={18} weight="bold" />
          )}
        </div>
      </button>
    </Reorder.Item>
  );
}
// ----------------------------------------------------------------------
// PODKOMPONENT: DraggablePricingItem (Pozwala na przeciąganie wewnątrz cennika)
// ----------------------------------------------------------------------
function DraggablePricingItem({ item, onUpdate, onRemove }: any) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      id={item.id}
      dragListener={false} // Wyłączamy drag dla całej karty, żeby inputy działały
      dragControls={dragControls}
      className="relative flex flex-col sm:flex-row sm:items-center justify-between p-5 md:p-6 border-2 border-[#EBF4F5] rounded-[24px] hover:border-[#287D88]  group/price transition-colors duration-300 w-full bg-white"
    >
      {/* Tło hover - sprzętowo akcelerowane */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#287D88]/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* MINI TOOLBAR (PRAWY DOLNY RÓG) */}
      {/* MINI TOOLBAR (PRAWY DOLNY RÓG - PIONOWO) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1 opacity-0 group-hover/price:opacity-100 transition-opacity bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-1 rounded-xl">
        <Tooltip content="Przeciągnij by zmienić kolejność" position="left">
          <div
            onPointerDown={(e) => dragControls.start(e)}
            style={{ touchAction: "none" }}
            className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors"
          >
            <List size={18} weight="bold" />
          </div>
        </Tooltip>

        {/* POZIOMY SEPARATOR */}
        <div className="w-5 h-px bg-gray-200 my-0.5" />

        <Tooltip content="Usuń usługę" position="left">
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash size={18} weight="bold" />
          </button>
        </Tooltip>
      </div>

      {/* ZAWARTOSĆ KARTY (LEWA STRONA) */}
      <div className="relative z-10 flex flex-col gap-1.5 w-full sm:w-2/3 pr-2 sm:pr-8">
        <input
          type="text"
          value={item.name || ""}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
          className="font-jakarta font-bold text-lg md:text-xl text-[#0B3B4C] bg-transparent outline-none border-b border-transparent focus:border-gray-200 w-full placeholder:text-gray-300 pb-0.5 transition-colors"
          placeholder="Nazwa usługi"
        />
        <div className="flex items-center gap-1.5 font-montserrat text-sm text-gray-500 font-medium">
          <Clock size={16} weight="duotone" className="text-[#287D88]" />
          <input
            type="number"
            value={item.duration || ""}
            onChange={(e) => onUpdate({ ...item, duration: e.target.value })}
            className="w-12 bg-transparent outline-none border-b border-transparent focus:border-gray-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-300 text-center transition-colors"
            placeholder="Czas"
          />
          <span>minut</span>
        </div>
      </div>

      {/* ZAWARTOSĆ KARTY (PRAWA STRONA - CENA) */}
      {/* Padding pr-20 na mobile zostawia miejsce dla toolbaru */}
      <div className="relative z-10 mt-3 sm:mt-0 flex items-center justify-start sm:justify-end w-full sm:w-1/3 pr-20 sm:pr-14">
        <input
          type="number"
          value={item.price || ""}
          onChange={(e) => onUpdate({ ...item, price: e.target.value })}
          className="w-20 text-left sm:text-right font-montserrat font-bold text-xl md:text-2xl text-[#287D88] bg-transparent outline-none border-b border-transparent focus:border-[#287D88]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-[#287D88]/40 transition-colors"
          placeholder="0"
        />
        <span className="font-montserrat font-bold text-xl md:text-2xl text-[#287D88] ml-1">
          zł
        </span>
      </div>
    </Reorder.Item>
  );
}
export default function BlockEditorCard({
  block,
  onDelete,
  onUpdate,
}: BlockEditorCardProps) {
  const [openIconPickerId, setOpenIconPickerId] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [pendingSelectedDbIds, setPendingSelectedDbIds] = useState<string[]>(
    [],
  ); // <--- NOWY STAN TYMCZASOWY
  const setContent = (newContent: any) => {
    onUpdate({ ...block, content: newContent });
  };
  const dragControls = useDragControls();

  const loadServicesFromDb = async () => {
    // Kiedy otwieramy popover, synchronizujemy "tymczasowe checkboxy" z tym, co już jest na liście
    if (!isServicePickerOpen) {
      const existingIds = (block.content?.items || [])
        .map((item: any) => item.originalId)
        .filter(Boolean);
      setPendingSelectedDbIds(existingIds);
    }

    setIsServicePickerOpen((prev) => !prev);

    if (dbServices.length === 0) {
      try {
        const res = await fetch("/api/admin/uslugi");
        if (res.ok) {
          const data = await res.json();
          setDbServices(data);
        }
      } catch (error) {
        console.error("Błąd pobierania usług z bazy:", error);
      }
    }
  };
  // --- MAGIA AUTO-ROZSZERZANIA TEXTAREA ---
  // Ta funkcja sprawia, że textarea rośnie w dół zamiast pokazywać scrollbar.
  // Ustawienie na '0px' na ułamek sekundy pozwala polu też "skurczyć się", gdy kasujemy tekst.
  const handleAutoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = "0px";
    target.style.height = `${target.scrollHeight}px`;
  };

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <RichTextInput
            value={block.content?.text || ""}
            onChange={(newHtml) => setContent({ text: newHtml })}
            // Dodano leading-[1.2] (zgodnie z --text-heading--line-height z Figmy)
            className="text-2xl md:text-3xl font-jakarta font-bold text-[#0B3B4C] leading-[1.2]"
          />
        );

      case "paragraph":
        return (
          <RichTextInput
            value={block.content?.text || ""}
            onChange={(newHtml) => setContent({ text: newHtml })}
            // Dodano leading-[1.7] (zgodnie z --text-paragraph--line-height z Figmy)
            className="text-gray-600 font-montserrat text-base leading-[1.7]"
          />
        );

      case "highlight":
        return (
          <div className="w-full border-l-4 border-brand-primary pl-4 py-1">
            <RichTextInput
              value={block.content?.text || ""}
              onChange={(newHtml) => setContent({ text: newHtml })}
              className="font-jakarta font-medium text-lg text-[#0B3B4C] leading-relaxed"
            />
          </div>
        );
      // ---------------------------------------------------------
      // 8. SEKCJA FAQ (TYLKO PYTANIA)
      // ---------------------------------------------------------
      case "faq":
        const faqItems = block.content?.items || [];

        return (
          <div className="w-full flex flex-col bg-white">
            {/* LISTA PYTAŃ Z DRAG & DROP */}
            <div className="w-full max-w-[900px] flex flex-col mx-auto">
              <Reorder.Group
                axis="y"
                values={faqItems}
                onReorder={(newOrderedItems) =>
                  setContent({ items: newOrderedItems })
                }
                className="flex flex-col w-full"
              >
                {faqItems.map((item: any, idx: number) => (
                  <DraggableFaqItem
                    key={item.id}
                    index={idx}
                    item={item}
                    isOpen={openFaqIndex === idx}
                    onToggle={() =>
                      setOpenFaqIndex(openFaqIndex === idx ? null : idx)
                    }
                    onUpdate={(updatedItem: any) => {
                      const newItems = [...faqItems];
                      newItems[idx] = updatedItem;
                      setContent({ items: newItems });
                    }}
                    onRemove={() => {
                      const newItems = faqItems.filter(
                        (_: any, i: number) => i !== idx,
                      );
                      setContent({ items: newItems });
                    }}
                  />
                ))}
              </Reorder.Group>

              {/* PRZYCISK DODAWANIA (GHOST BUTTON) */}
              <button
                onClick={() => {
                  const newItems = [
                    ...faqItems,
                    { id: crypto.randomUUID(), question: "", answer: "" },
                  ];
                  setContent({ items: newItems });
                  setOpenFaqIndex(newItems.length - 1);
                }}
                className="flex items-center justify-center gap-3 w-full p-4 mt-6 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-2xl opacity-60 hover:opacity-100 hover:bg-gray-50 hover:border-[#287D88]/50 transition-all group/add cursor-pointer"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover/add:bg-white shadow-sm transition-colors text-gray-400 group-hover/add:text-[#287D88]">
                  <Plus size={18} weight="bold" />
                </div>
                <span className="font-montserrat font-semibold text-sm text-gray-500 group-hover/add:text-[#287D88] transition-colors">
                  Dodaj kolejne pytanie
                </span>
              </button>
            </div>
          </div>
        );
      // ---------------------------------------------------------
      // 4. KARTY ZALET (GHOST CARD + UKRYTY GRID IKON)
      // ---------------------------------------------------------
      // ---------------------------------------------------------
      // 4. KARTY ZALET (GHOST CARD + FLOATING POPOVER)
      // ---------------------------------------------------------
      case "featuresGrid":
        const featureItems = block.content?.items || [];
        return (
          <div className="w-full flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full">
              {/* RENDEROWANIE STWORZONYCH KART */}
              {featureItems.map((item: any, idx: number) => {
                const isPickerOpen = openIconPickerId === item.id;
                const hasSelectedIcon = !!item.icon && ICONS[item.icon];
                const SelectedIcon = hasSelectedIcon ? ICONS[item.icon] : Plus;

                return (
                  <div
                    key={item.id}
                    // Karta MA relative, więc popover będzie się pozycjonował względem niej
                    className="flex flex-col items-start gap-4 p-5 w-full bg-[#287D88] rounded-[20px] shadow-sm relative group/card transition-all"
                  >
                    {/* PRZYCISK USUWANIA KARTY */}
                    <button
                      onClick={() => {
                        const newItems = featureItems.filter(
                          (_: any, i: number) => i !== idx,
                        );
                        setContent({ items: newItems });
                      }}
                      className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-red-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer z-10"
                      title="Usuń kartę"
                    >
                      <Trash size={14} weight="bold" />
                    </button>

                    {/* PRZYCISK WYBORU IKONY (Toggle) */}
                    <button
                      onClick={() =>
                        setOpenIconPickerId(isPickerOpen ? null : item.id)
                      }
                      className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 transition-all cursor-pointer border-2 ${
                        hasSelectedIcon
                          ? "bg-white/10 border-transparent hover:bg-white/20"
                          : "bg-transparent border-dashed border-white/50 hover:border-white hover:bg-white/10"
                      }`}
                      title="Zmień ikonę"
                    >
                      <SelectedIcon
                        size={24}
                        weight={hasSelectedIcon ? "duotone" : "bold"}
                        className="text-white"
                      />
                    </button>

                    {/* PŁYWAJĄCA PALETA IKON (Wyjęta z DOM-u - Popover) */}
                    {isPickerOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        // Absolute wyciąga to z normalnego układu. Z-50 daje to zawsze na sam wierzch!
                        className="absolute top-[75px] left-5 z-50 w-[260px] bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-gray-100 origin-top-left"
                      >
                        <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            Wybierz ikonę
                          </span>
                          <button
                            onClick={() => setOpenIconPickerId(null)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ICONS).map(([key, IconComp]) => {
                            const isActive = item.icon === key;
                            return (
                              <button
                                key={key}
                                onClick={() => {
                                  const newItems = [...featureItems];
                                  newItems[idx].icon = key;
                                  setContent({ items: newItems });
                                  setOpenIconPickerId(null); // Zamknij po wyborze
                                }}
                                className={`p-2 rounded-xl cursor-pointer transition-all ${
                                  isActive
                                    ? "bg-[#287D88] text-white shadow-md scale-110" // Aktywna = Niebieska
                                    : "text-gray-500 hover:bg-gray-100 hover:text-[#0B3B4C]" // Nieaktywna = Szara, podświetla się na biało-szaro
                                }`}
                                title={key}
                              >
                                <IconComp
                                  size={22}
                                  weight={isActive ? "fill" : "duotone"}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* EDYTOR TEKSTU */}
                    <div className="w-full mt-1">
                      <RichTextInput
                        value={item.text || ""}
                        onChange={(newHtml) => {
                          const newItems = [...featureItems];
                          newItems[idx].text = newHtml;
                          setContent({ items: newItems });
                        }}
                        className="text-white font-montserrat font-medium text-[14px] leading-relaxed placeholder:text-white/40"
                      />
                    </div>
                  </div>
                );
              })}

              {/* KARTA-DUCH (GHOST CARD) DO DODAWANIA NOWYCH */}
              <button
                onClick={() => {
                  const newItemId = crypto.randomUUID();
                  setContent({
                    items: [
                      ...featureItems,
                      { id: newItemId, text: "<p>Nowa zaleta</p>", icon: "" },
                    ],
                  });
                  setOpenIconPickerId(newItemId);
                }}
                className="flex flex-col items-center justify-center gap-4 p-5 w-full bg-[#287D88]/5 border-2 border-dashed border-[#287D88]/30 rounded-[20px] transition-all hover:bg-[#287D88]/10 hover:border-[#287D88]/60 cursor-pointer min-h-[160px] group/ghost"
              >
                <div className="w-14 h-14 flex items-center justify-center bg-[#287D88]/10 group-hover:bg-[#287D88]/20 transition-colors rounded-full text-[#287D88]/60 group-hover:text-[#287D88]">
                  <Plus size={28} weight="bold" />
                </div>
                <span className="font-montserrat font-bold text-[14px] text-[#287D88]/60 group-hover:text-[#287D88] transition-colors">
                  Dodaj kolejną kartę
                </span>
              </button>
            </div>
          </div>
        );

      // ---------------------------------------------------------

      case "bulletList":
        const listItems = block.content?.items || [];
        return (
          <div className="w-full flex flex-col gap-3">
            {/* ISTNIEJĄCE PUNKTY LISTY */}
            {listItems.map((item: any, idx: number) => (
              <div
                key={item.id}
                className="flex items-start gap-4 w-full group/item"
              >
                <CheckCircle
                  size={24}
                  weight="fill"
                  className="text-[#287D88] shrink-0 mt-1"
                />
                <div className="flex-1 w-full">
                  <RichTextInput
                    value={item.text || ""}
                    onChange={(newHtml) => {
                      const newItems = [...listItems];
                      newItems[idx].text = newHtml;
                      setContent({ items: newItems });
                    }}
                    className="text-gray-600 font-montserrat text-base leading-[1.7]"
                  />
                </div>
                <button
                  onClick={() => {
                    const newItems = listItems.filter(
                      (_: any, i: number) => i !== idx,
                    );
                    setContent({ items: newItems });
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
                  title="Usuń punkt"
                >
                  <Trash size={18} weight="bold" />
                </button>
              </div>
            ))}

            {/* PRZYCISK "DODAJ" JAKO GHOST POINT */}
            <button
              onClick={() =>
                setContent({
                  items: [...listItems, { id: crypto.randomUUID(), text: "" }],
                })
              }
              className="flex items-start gap-4 w-full opacity-50 hover:opacity-100 transition-opacity group/add cursor-pointer mt-1"
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0 mt-1">
                <Plus size={20} weight="bold" className="text-[#287D88]" />
              </div>
              <span className="text-gray-400 font-montserrat text-base leading-[1.7] italic">
                Dodaj kolejny punkt...
              </span>
            </button>
          </div>
        );
      // ---------------------------------------------------------
      // 6. PRZERWA WIZUALNA
      // ---------------------------------------------------------
      case "spacer":
        return (
          <div className="w-full flex items-center justify-center h-16 border border-dashed border-brand-primary/20 rounded-lg bg-brand-primary/[0.02]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-primary/40">
              Przerwa wizualna
            </span>
          </div>
        );
      // ---------------------------------------------------------
      // 5. CENNIK / HARMONOGRAM / USŁUGI (Z GHOST ADDEREM)
      // ---------------------------------------------------------
      // ---------------------------------------------------------
      // 5. CENNIK / HARMONOGRAM / USŁUGI (Z DROPDOWNEM Z BAZY)
      // ---------------------------------------------------------
      // ---------------------------------------------------------
      // 5. CENNIK / HARMONOGRAM (WYGLĄD Z FRONTENDU + TOOLTIPY)
      // ---------------------------------------------------------
      case "pricingList":
        const priceItems = block.content?.items || [];

        const allDbServicesChecked =
          dbServices.length > 0 &&
          dbServices.every((dbS) => pendingSelectedDbIds.includes(dbS.id));

        // Zaznaczanie checkboxa w popoverze (tylko w pamięci)
        const handleTogglePending = (dbId: string, isChecked: boolean) => {
          if (isChecked) {
            setPendingSelectedDbIds((prev) => [...prev, dbId]);
          } else {
            setPendingSelectedDbIds((prev) => prev.filter((id) => id !== dbId));
          }
        };

        // Zaznacz wszystkie
        const handleToggleAllPending = (isChecked: boolean) => {
          if (isChecked) {
            setPendingSelectedDbIds(dbServices.map((s) => s.id));
          } else {
            setPendingSelectedDbIds([]);
          }
        };

        // AKCEPTACJA WYBORU Z BAZY
        const confirmDbServicesSelection = () => {
          const manualItems = priceItems.filter(
            (item: any) => !item.originalId,
          ); // Zostawiamy wpisane ręcznie

          const newDbItems = pendingSelectedDbIds.map((dbId) => {
            // Jeśli usługa już była, zostawiamy ją (żeby nie nadpisać ręcznych zmian ceny/czasu)
            const existing = priceItems.find(
              (item: any) => item.originalId === dbId,
            );
            if (existing) return existing;

            // Tworzymy nową
            const dbRef = dbServices.find((s) => s.id === dbId);
            return {
              id: crypto.randomUUID(),
              originalId: dbRef.id,
              name: dbRef.name,
              duration: dbRef.duration?.toString() || "",
              price: dbRef.price?.toString() || "",
            };
          });

          setContent({ items: [...manualItems, ...newDbItems] });
          setIsServicePickerOpen(false); // Zamykamy
        };

        return (
          <div className="w-full flex flex-col gap-2">
            {/* KARTY CENNIKA WZOROWANE NA FRONTENDZIE */}
            <Reorder.Group
              axis="y"
              values={priceItems}
              onReorder={(newOrderedItems) =>
                setContent({ items: newOrderedItems })
              }
              className="flex flex-col gap-2 w-full"
            >
              {priceItems.map((item: any, idx: number) => (
                <DraggablePricingItem
                  key={item.id}
                  item={item}
                  onUpdate={(updatedItem: any) => {
                    const newItems = [...priceItems];
                    newItems[idx] = updatedItem;
                    setContent({ items: newItems });
                  }}
                  onRemove={() => {
                    const newItems = priceItems.filter(
                      (_: any, i: number) => i !== idx,
                    );
                    setContent({ items: newItems });
                  }}
                />
              ))}
            </Reorder.Group>

            {/* KONTROLKI DODAWANIA */}
            <div className="relative  flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={() =>
                  setContent({
                    items: [
                      ...priceItems,
                      {
                        id: crypto.randomUUID(),
                        name: "",
                        duration: "",
                        price: "",
                      },
                    ],
                  })
                }
                className="flex items-center cursor-pointer justify-center gap-2 flex-1 p-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[20px] hover:bg-gray-100 hover:border-[#287D88]/30 transition-colors text-gray-500 hover:text-[#287D88] font-montserrat text-sm font-semibold"
              >
                <Plus size={18} weight="bold" /> Dodaj pustą usługę
              </button>

              <button
                onClick={loadServicesFromDb}
                className={`flex cursor-pointer items-center justify-center gap-2 flex-1 p-3.5 rounded-[20px] transition-all font-montserrat text-sm font-semibold border ${
                  isServicePickerOpen
                    ? "bg-[#287D88] text-white border-[#287D88] shadow-md"
                    : "bg-white text-[#287D88] border-[#287D88]/30 hover:bg-[#287D88]/5 hover:border-[#287D88]"
                }`}
              >
                Wybierz z bazy
              </button>

              {/* POPOVER Z BAZĄ */}
              {isServicePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full right-0 mt-3 z-50 w-full sm:w-[340px] bg-white border border-gray-100 rounded-[24px] shadow-xl p-5 origin-top-right flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={allDbServicesChecked}
                          onChange={(e) =>
                            handleToggleAllPending(e.target.checked)
                          }
                          className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-[#287D88] checked:border-[#287D88] transition-colors cursor-pointer"
                        />
                        <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                          <CheckCircle size={14} weight="bold" />
                        </div>
                      </div>
                      <span className="font-jakarta font-bold text-sm text-[#0B3B4C]">
                        Zaznacz wszystkie
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {dbServices.length === 0 ? (
                      <span className="text-sm text-gray-400 italic py-2">
                        Ładowanie z bazy... (lub brak)
                      </span>
                    ) : (
                      dbServices.map((dbService) => {
                        const isChecked = pendingSelectedDbIds.includes(
                          dbService.id,
                        );
                        return (
                          <label
                            key={dbService.id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors group border border-transparent ${isChecked ? "bg-[#287D88]/5 border-[#287D88]/20" : "hover:bg-gray-50"}`}
                          >
                            <div className="relative flex items-center justify-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleTogglePending(
                                    dbService.id,
                                    e.target.checked,
                                  )
                                }
                                className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-md checked:bg-[#287D88] checked:border-[#287D88] transition-colors cursor-pointer"
                              />
                              <div className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none">
                                <CheckCircle size={14} weight="bold" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`font-montserrat text-sm transition-colors ${isChecked ? "font-bold text-[#0B3B4C]" : "font-medium text-gray-600 group-hover:text-[#0B3B4C]"}`}
                              >
                                {dbService.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {dbService.duration} min • {dbService.price} zł
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* PRZYCISK ZATWIERDZANIA */}
                  <div className="pt-2">
                    <button
                      onClick={confirmDbServicesSelection}
                      className="w-full bg-[#287D88] hover:bg-[#1f626a] text-white font-montserrat font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
                    >
                      Zatwierdź wybrane
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-gray-400 font-montserrat text-sm">
            Nieobsługiwany typ bloku: {block.type}
          </div>
        );
    }
  };

  // ============================================================================
  // RENDER GŁÓWNY KARTY
  // ============================================================================
  return (
    <Reorder.Item
      value={block} // <--- TO MÓWI FRAMEROWI KTÓRY TO ELEMENT W TABLICY
      id={block.id}
      dragListener={false} // <--- WYŁĄCZAMY DRAG NA CAŁEJ KARCIE (dzięki temu działa zaznaczanie tekstu)
      dragControls={dragControls} // <--- PRZEKAZUJEMY KONTROLER
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative group/element flex items-start w-full  border border-transparent hover:border-gray-100 bg-white hover:bg-gray-50/80 rounded-[20px] transition-colors"
    >
      {/* IKONKI KONTROLNE (PRAWY GÓRNY RÓG) */}
      <div className="absolute right-0 top-0 opacity-0 group-hover/element:opacity-100 flex items-center gap-1 transition-opacity bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100 z-10">
        {/* NASZ UCHWYT (DRAG HANDLE) */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          style={{ touchAction: "none" }}
          className="p-1.5 text-gray-400 hover:text-[#0B3B4C] cursor-grab active:cursor-grabbing transition-colors select-none"
          title="Przeciągnij"
        >
          <DotsSixVertical size={18} weight="bold" />
        </div>

        <div className="w-px h-4 bg-gray-200 mx-0.5" />

        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Usuń element"
        >
          <Trash size={18} weight="bold" />
        </button>
      </div>

      {/* ZAWARTOŚĆ ELEMENTU */}
      <div className="w-full pr-16 mt-1">{renderContent()}</div>
    </Reorder.Item>
  );
}
