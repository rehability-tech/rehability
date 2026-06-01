"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useTransition,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  X,
  Trash,
  FloppyDisk,
  CircleNotch,
  Clock,
  CaretDown,
  Info,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import type { TripEventType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/ToolTip";
import { SerializedEvent } from "./timegrid/types";
import { ICON_OPTIONS } from "./timegrid/constants";
import type { TripServiceOption } from "./TimeGrid";

interface EventPayload {
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  type: TripEventType;
  icon: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface EventDraft {
  id?: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string | null;
  type: TripEventType;
  icon: string | null;
  isBookable?: boolean;
  serviceId?: string;
  capacity?: number;
  maxTime?: string | null; // DODANE POLE
  spotsTaken?: number; // dla bloków — gdy > 0, blokujemy usuwanie
}

interface Props {
  tripId: string;
  initial: EventDraft;
  isEdit: boolean;
  services: TripServiceOption[];
  onClose: () => void;
  onSaved: (event: SerializedEvent) => void;
  onDelete?: () => void;
}

const TYPES: { value: TripEventType; label: string }[] = [
  { value: "GENERAL", label: "Ogólne" },
  { value: "MEAL", label: "Posiłek" },
  { value: "ACTIVITY", label: "Aktywność" },
  { value: "WELLNESS_FREE", label: "Wellness" },
  { value: "ANNOUNCEMENT", label: "Ogłoszenie" },
];

function extractTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const mins = Math.round(d.getMinutes() / 5) * 5;
  const safeMins = mins === 60 ? 0 : mins;
  const safeHours = mins === 60 ? d.getHours() + 1 : d.getHours();
  return `${pad(safeHours)}:${pad(safeMins)}`;
}

function getSmartEndTime(startStr: string): string {
  let [h, m] = startStr.split(":").map(Number);
  h += 1;
  if (h > 23) {
    h = 23;
    m = 55;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

function applyTimeToDate(baseIso: string, timeStr: string): Date {
  const d = new Date(baseIso);
  const [hours, minutes] = timeStr.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function CustomTimeDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-11 h-8 flex items-center justify-center text-[16px] font-bold transition-all rounded-lg outline-none",
          isOpen
            ? "bg-brand-primary/10 text-brand-primary"
            : "text-brand-secondary hover:bg-gray-50 hover:text-brand-primary",
        )}
      >
        {value}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-16 max-h-[200px] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[16px] shadow-[0_15px_40px_-10px_rgba(3,63,99,0.2)] z-[250] py-1.5 flex flex-col gap-0.5"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-[85%] mx-auto text-center py-2 text-[14px] font-bold rounded-xl transition-colors",
                  value === opt
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-brand-secondary/70 hover:bg-brand-primary/10 hover:text-brand-primary",
                )}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Zaktualizowany CustomTimeSelect obsługujący maxTime
function CustomTimeSelect({
  value,
  onChange,
  minTime,
  maxTime,
}: {
  value: string;
  onChange: (val: string) => void;
  minTime?: string;
  maxTime?: string | null;
}) {
  const [h, m] = value ? value.split(":") : ["09", "00"];
  const [minH, minM] = minTime ? minTime.split(":") : ["00", "00"];
  const [maxH, maxM] = maxTime ? maxTime.split(":") : ["23", "55"];

  const allHours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0"),
  );
  const allMinutes = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, "0"),
  );

  const availableHours = allHours.filter((hr) => {
    if (minTime && hr < minH) return false;
    if (maxTime && hr > maxH) return false;
    return true;
  });

  const availableMinutes = allMinutes.filter((min) => {
    if (minTime && h === minH && min < minM) return false;
    if (maxTime && h === maxH && min > maxM) return false;
    return true;
  });

  useEffect(() => {
    if (!value) return;
    let newH = h;
    let newM = m;
    let changed = false;
    if (minTime && value < minTime) {
      newH = minH;
      newM = minM;
      changed = true;
    } else if (maxTime && value > maxTime) {
      newH = maxH;
      newM = maxM;
      changed = true;
    }
    if (changed) onChange(`${newH}:${newM}`);
  }, [minTime, maxTime, value, h, m, minH, minM, maxH, maxM, onChange]);

  const handleHourChange = (newH: string) => {
    let newM = m || "00";
    if (minTime && newH === minH && newM < minM) newM = minM;
    if (maxTime && newH === maxH && newM > maxM) newM = maxM;
    onChange(`${newH}:${newM}`);
  };
  const handleMinChange = (newM: string) => onChange(`${h || "09"}:${newM}`);

  return (
    <div className="relative flex items-center w-full bg-white border border-brand-secondary/15 rounded-2xl h-[52px] px-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand-primary/20 focus-within:border-brand-primary group">
      <div className="w-8 h-8 rounded-xl bg-brand-primary/5 flex items-center justify-center shrink-0 mr-2">
        <Clock size={16} weight="bold" className="text-brand-primary" />
      </div>
      <div className="flex items-center justify-center flex-1 pr-2">
        <CustomTimeDropdown
          value={h}
          options={availableHours}
          onChange={handleHourChange}
        />
        <span className="text-[15px] font-bold text-brand-secondary/30 mx-1 pb-0.5">
          :
        </span>
        <CustomTimeDropdown
          value={m}
          options={availableMinutes}
          onChange={handleMinChange}
        />
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Wybierz",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;
  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between bg-white border rounded-2xl px-4 h-[52px] transition-all outline-none shadow-sm",
          isOpen
            ? "border-brand-primary ring-2 ring-brand-primary/20"
            : "border-brand-secondary/15 hover:border-brand-secondary/30",
        )}
      >
        <span className="text-[14px] font-medium text-brand-secondary truncate pr-4">
          {selectedLabel}
        </span>
        <CaretDown
          size={16}
          weight="bold"
          className={cn(
            "text-brand-secondary/40 transition-transform duration-300 shrink-0",
            isOpen && "rotate-180 text-brand-primary",
          )}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[20px] shadow-[0_15px_40px_-10px_rgba(3,63,99,0.2)] z-[250] p-2 flex flex-col gap-1 max-h-[220px] overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-[14px] text-[13.5px] font-bold transition-all",
                  value === opt.value
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-brand-secondary/70 hover:bg-gray-50 hover:text-brand-secondary",
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EventModal({
  tripId,
  initial,
  isEdit,
  services,
  onClose,
  onSaved,
  onDelete,
}: Props) {
  const [entryMode, setEntryMode] = useState<"EVENT" | "SLOT">(
    initial.isBookable ? "SLOT" : "EVENT",
  );
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [type, setType] = useState<TripEventType>(initial.type);
  const [icon, setIcon] = useState<string | null>(initial.icon);
  const [capacity, setCapacity] = useState<string>(
    initial.capacity ? String(initial.capacity) : "3",
  );
  const [isOpenBlock, setIsOpenBlock] = useState<boolean>(false);
  // Mapa serviceId -> wpisana capacity (string, bo input controlled).
  // Brak klucza = usługa nieoznaczona.
  const [serviceCapacities, setServiceCapacities] = useState<
    Record<string, string>
  >({});

  const toggleService = (id: string) => {
    setServiceCapacities((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: "1" };
    });
  };

  const setServiceCapacity = (id: string, value: string) => {
    // Pozwalamy na "" w trakcie edycji; walidujemy przy submit.
    setServiceCapacities((prev) =>
      id in prev ? { ...prev, [id]: value } : prev,
    );
  };

  const initialStart = extractTime(initial.startTime);
  const [startTime, setStartTime] = useState(initialStart);

  // RYGORYSTYCZNE clamping: bazowo start + 1h, ale nigdy nie przekraczamy maxTime.
  // Także gwarantujemy końcówkę > start (gdy max == start, fallback do max — UI dropdownu i tak
  // wymusi pojedynczą wartość).
  const calcDefaultEnd = (
    start: string,
    max: string | null | undefined,
  ): string => {
    const smartEnd = getSmartEndTime(start);
    if (max && smartEnd > max) return max;
    return smartEnd;
  };

  // Clamp także istniejącego endTime (edycja lub przekazany draft) względem maxTime.
  const clampToMax = (time: string, max: string | null | undefined): string => {
    if (max && time > max) return max;
    return time;
  };

  const [endTime, setEndTime] = useState(
    initial.endTime
      ? clampToMax(extractTime(initial.endTime), initial.maxTime)
      : calcDefaultEnd(initialStart, initial.maxTime),
  );

  const [pending, startTransition] = useTransition();

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setEndTime(calcDefaultEnd(newStart, initial.maxTime));
  };

  // Długość bloku w minutach — blokujemy usługi które się nie mieszczą.
  const blockDurationMinutes = useMemo(() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return eh * 60 + em - (sh * 60 + sm);
  }, [startTime, endTime]);

  // Przy zmianie długości bloku — odznacz usługi które przestały się mieścić.
  useEffect(() => {
    setServiceCapacities((prev) => {
      const next: Record<string, string> = {};
      for (const [sid, cap] of Object.entries(prev)) {
        const svc = services.find((s) => s.id === sid);
        if (svc && svc.duration <= blockDurationMinutes) next[sid] = cap;
      }
      return next;
    });
  }, [blockDurationMinutes, services]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const startObj = applyTimeToDate(initial.startTime, startTime);
    const endObj = applyTimeToDate(initial.startTime, endTime);
    if (endObj <= startObj) endObj.setDate(endObj.getDate() + 1);

    startTransition(async () => {
      try {
        if (entryMode === "EVENT") {
          const trimmedTitle = title.trim();
          if (!trimmedTitle) {
            toast.error("Podaj tytuł wydarzenia");
            return;
          }
          const payload: EventPayload = {
            title: trimmedTitle,
            description: description.trim() || null,
            startTime: startObj.toISOString(),
            endTime: endObj.toISOString(),
            type,
            icon: icon || null,
            isPublished: true,
            sortOrder: 0,
          };
          const url =
            isEdit && initial.id
              ? `/api/admin/wyjazdy/${tripId}/harmonogram/${initial.id}`
              : `/api/admin/wyjazdy/${tripId}/harmonogram`;
          const method = isEdit && initial.id ? "PATCH" : "POST";
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error ?? "Nie udało się zapisać punktu.");
            return;
          }
          toast.success(isEdit ? "Zaktualizowano punkt" : "Dodano punkt");
          onSaved({ ...data.event, isBookable: false });
        } else {
          if (isEdit) {
            toast.error("Edycja bloków nie jest jeszcze obsługiwana.");
            return;
          }
          const parsedCapacity = parseInt(capacity, 10);
          if (isOpenBlock && (isNaN(parsedCapacity) || parsedCapacity <= 0)) {
            toast.error("Nieprawidłowa liczba miejsc");
            return;
          }
          let serviceCapacitiesPayload: {
            serviceId: string;
            capacity: number;
          }[] = [];
          if (!isOpenBlock) {
            const entries = Object.entries(serviceCapacities);
            if (entries.length === 0) {
              toast.error(
                "Wybierz przynajmniej jedną usługę lub zaznacz wolny blok",
              );
              return;
            }
            for (const [sid, raw] of entries) {
              const n = parseInt(raw, 10);
              if (isNaN(n) || n <= 0) {
                const svc = services.find((s) => s.id === sid);
                toast.error(
                  `Wpisz poprawną liczbę miejsc dla „${svc?.name ?? "usługi"}”`,
                );
                return;
              }
              serviceCapacitiesPayload.push({
                serviceId: sid,
                capacity: n,
              });
            }
          }
          const res = await fetch(`/api/admin/wyjazdy/${tripId}/slots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              capacity: parsedCapacity,
              startTime: startObj.toISOString(),
              endTime: endObj.toISOString(),
              isOpen: isOpenBlock,
              serviceCapacities: isOpenBlock ? [] : serviceCapacitiesPayload,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            toast.error(data.error ?? "Nie udało się utworzyć bloku usług.");
            return;
          }
          toast.success("Dodano nowy blok usług do harmonogramu");
          const block = data.block;
          onSaved({
            id: block?.id ?? `service_${Date.now()}`,
            title: "Blok Usług",
            description: `${parsedCapacity} ${parsedCapacity === 1 ? "miejsce" : "miejsc"} · wybór z katalogu usług`,
            startTime: startObj.toISOString(),
            endTime: endObj.toISOString(),
            type: "WELLNESS_FREE",
            icon: "Sparkle",
            isPublished: true,
            sortOrder: 0,
            isBookable: true,
            spotsAvailable: parsedCapacity,
          });
        }
      } catch {
        toast.error("Błąd sieci. Spróbuj ponownie.");
      }
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-brand-secondary/40 backdrop-blur-sm"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        className="fixed top-0 right-0 bottom-0 z-[201] w-full sm:w-[480px] bg-white/95 backdrop-blur-2xl border-l border-white/40 shadow-[0_30px_80px_-20px_rgba(3,63,99,0.35)] flex flex-col"
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-brand-secondary/10 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/50 font-bold">
              Harmonogram
            </p>
            <h2 className="font-jakarta text-[18px] font-bold text-brand-secondary leading-tight mt-0.5">
              {isEdit ? "Edytuj wpis" : "Dodaj wpis do kalendarza"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-brand-secondary/10 hover:bg-brand-secondary/5 flex items-center justify-center text-brand-secondary transition"
          >
            <X size={18} weight="bold" />
          </button>
        </header>

        <form
          onSubmit={submit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar pb-24"
        >
          {!isEdit && (
            <div className="flex items-center gap-2">
              <div className="flex flex-1 bg-brand-secondary/5 p-1 rounded-2xl shadow-inner border border-brand-secondary/5">
                <button
                  type="button"
                  onClick={() => setEntryMode("EVENT")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold rounded-xl transition-all",
                    entryMode === "EVENT"
                      ? "bg-white text-brand-primary shadow-sm"
                      : "text-brand-secondary/50 hover:text-brand-secondary",
                  )}
                >
                  Punkt programu
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("SLOT")}
                  className={cn(
                    "flex-1 py-3 text-[13px] font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                    entryMode === "SLOT"
                      ? "bg-white text-brand-primary shadow-sm"
                      : "text-brand-secondary/50 hover:text-brand-secondary",
                  )}
                >
                  Blok Usług
                  <Tooltip
                    position="bottom"
                    content="Rama czasowa, w której uczestniczki mogą rezerwować wybrane przez Ciebie usługi (np. masaż, fizjoterapia). Ustal pojemność = ile równoległych rezerwacji wchodzi w ten przedział. Zaznacz „Wolny blok”, jeśli wszystkie usługi z katalogu mają być dostępne."
                  >
                    <Info
                      size={14}
                      weight="bold"
                      className="text-brand-secondary/40"
                    />
                  </Tooltip>
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                Godzina od
              </label>
              <CustomTimeSelect
                value={startTime}
                onChange={handleStartTimeChange}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                Godzina do
              </label>
              <CustomTimeSelect
                value={endTime}
                onChange={setEndTime}
                minTime={startTime}
                maxTime={initial.maxTime}
              />
            </div>
          </div>

          <div className="w-full h-px bg-brand-secondary/10 my-2" />

          {entryMode === "EVENT" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                  Tytuł wydarzenia
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Poranna joga w plenerze"
                  className="w-full bg-white border border-brand-secondary/15 rounded-2xl h-[52px] px-4 text-[14px] font-medium text-brand-secondary placeholder:text-brand-secondary/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
                  maxLength={120}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                  Typ punktu
                </label>
                <CustomSelect
                  value={type}
                  options={TYPES}
                  onChange={(val) => setType(val as TripEventType)}
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                  Własna Ikona (opcjonalnie)
                </label>
                <div className="grid grid-cols-5 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIcon(null)}
                    className={cn(
                      "aspect-square rounded-[18px] border flex flex-col items-center justify-center gap-1 transition-all",
                      icon === null
                        ? "bg-brand-primary text-white border-brand-primary shadow-[0_8px_20px_-8px_rgba(40,125,136,0.5)] scale-105"
                        : "bg-white border-brand-secondary/10 text-brand-secondary/50 hover:border-brand-primary/40",
                    )}
                  >
                    <X size={20} weight="bold" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Auto
                    </span>
                  </button>
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setIcon(opt.value)}
                      className={cn(
                        "aspect-square rounded-[18px] border flex flex-col items-center justify-center gap-1 transition-all",
                        icon === opt.value
                          ? "bg-brand-primary text-white border-brand-primary shadow-[0_8px_20px_-8px_rgba(40,125,136,0.5)] scale-105"
                          : "bg-white border-brand-secondary/10 text-brand-secondary/60 hover:border-brand-primary/40 hover:text-brand-primary",
                      )}
                    >
                      {opt.node}
                      <span className="text-[9px] font-bold uppercase tracking-wider">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                  Opis szczegółowy (opcjonalnie)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Zanotuj ważne informacje dla uczestników..."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-white border border-brand-secondary/15 rounded-2xl px-4 py-3 text-[14px] font-medium text-brand-secondary placeholder:text-brand-secondary/30 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 resize-none transition-all shadow-sm"
                />
              </div>
            </motion.div>
          )}

          {entryMode === "SLOT" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <button
                type="button"
                onClick={() => setIsOpenBlock((v) => !v)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all",
                  isOpenBlock
                    ? "bg-brand-primary/5 border-brand-primary/40 shadow-sm"
                    : "bg-white border-brand-secondary/15 hover:border-brand-secondary/30",
                )}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                    isOpenBlock
                      ? "bg-brand-primary border-brand-primary"
                      : "bg-white border-brand-secondary/30",
                  )}
                >
                  {isOpenBlock && (
                    <Check size={12} weight="bold" className="text-white" />
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-brand-secondary">
                    Wolny blok
                  </p>
                  <p className="text-[11px] text-brand-secondary/55 leading-snug mt-0.5">
                    Uczestniczki mogą rezerwować dowolną usługę z katalogu
                    wyjazdu.
                  </p>
                </div>
              </button>

              {isOpenBlock ? (
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-1.5 pl-1">
                    Liczba dostępnych miejsc
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full max-w-[150px] bg-white border border-brand-secondary/15 rounded-2xl h-[52px] px-4 text-[16px] font-bold text-brand-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all shadow-sm"
                  />
                  <p className="text-[10px] font-bold text-brand-secondary/40 mt-1.5 pl-1">
                    Ilu klientów może zarezerwować dowolną usługę w tym samym
                    czasie?
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] uppercase tracking-wider font-bold text-brand-secondary/50 block mb-2 pl-1">
                    Dostępne usługi w tym bloku (
                    {blockDurationMinutes > 0
                      ? `${blockDurationMinutes} min`
                      : "—"}
                    )
                  </label>
                  {services.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                      <p className="text-[12px] font-medium text-amber-800 leading-relaxed">
                        Ten wyjazd nie ma jeszcze zdefiniowanych usług. Dodaj
                        usługi w edytorze treści wyjazdu albo użyj „Wolnego
                        bloku”.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {services.map((svc) => {
                        const checked = svc.id in serviceCapacities;
                        const tooLong = svc.duration > blockDurationMinutes;
                        return (
                          <div
                            key={svc.id}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                              tooLong
                                ? "bg-gray-50 border-gray-100 opacity-60"
                                : checked
                                  ? "bg-brand-primary/5 border-brand-primary/40 shadow-sm"
                                  : "bg-white border-brand-secondary/15 hover:border-brand-secondary/30",
                            )}
                          >
                            <button
                              type="button"
                              disabled={tooLong}
                              onClick={() => toggleService(svc.id)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left disabled:cursor-not-allowed"
                            >
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                                  tooLong
                                    ? "bg-gray-100 border-gray-200"
                                    : checked
                                      ? "bg-brand-primary border-brand-primary"
                                      : "bg-white border-brand-secondary/30",
                                )}
                              >
                                {checked && !tooLong && (
                                  <Check
                                    size={12}
                                    weight="bold"
                                    className="text-white"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={cn(
                                    "text-[13px] font-bold truncate",
                                    tooLong
                                      ? "text-brand-secondary/50"
                                      : "text-brand-secondary",
                                  )}
                                >
                                  {svc.name}
                                </p>
                                <p
                                  className={cn(
                                    "text-[11px]",
                                    tooLong
                                      ? "text-rose-600 font-medium"
                                      : "text-brand-secondary/55",
                                  )}
                                >
                                  {svc.duration} min · {svc.price.toFixed(0)} zł
                                  {tooLong &&
                                    ` · nie mieści się w bloku ${blockDurationMinutes} min`}
                                </p>
                              </div>
                            </button>

                            {checked && !tooLong && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={serviceCapacities[svc.id]}
                                  onChange={(e) =>
                                    setServiceCapacity(svc.id, e.target.value)
                                  }
                                  className="w-16 h-10 bg-white border border-brand-primary/30 rounded-xl px-2 text-center text-[14px] font-bold text-brand-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary/50">
                                  miejsc
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </form>

        <footer className="px-6 py-4 border-t border-brand-secondary/10 shrink-0 flex items-center justify-between gap-3 bg-gray-50/50">
          {isEdit && onDelete ? (
            (() => {
              const locked = !!(
                initial.isBookable &&
                initial.spotsTaken &&
                initial.spotsTaken > 0
              );
              return (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={locked}
                  title={
                    locked
                      ? `Nie można usunąć — blok ma ${initial.spotsTaken} aktywnych rezerwacji`
                      : undefined
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all",
                    locked
                      ? "text-gray-400 border-transparent cursor-not-allowed"
                      : "text-rose-600 hover:bg-rose-100 border-transparent hover:border-rose-200",
                  )}
                >
                  <Trash size={16} weight="duotone" />
                  {locked
                    ? `Zablokowane (${initial.spotsTaken} rezerwacji)`
                    : "Usuń"}
                </button>
              );
            })()
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-brand-secondary/60 hover:text-brand-secondary hover:bg-white border border-transparent hover:border-brand-secondary/10 shadow-sm transition-all"
            >
              Anuluj
            </button>
            <button
              type="submit"
              onClick={submit}
              disabled={pending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/90 text-white text-[13.5px] font-bold shadow-[0_8px_20px_-6px_rgba(40,125,136,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(40,125,136,0.6)] transition-all active:scale-95 disabled:opacity-60"
            >
              {pending ? (
                <CircleNotch
                  size={16}
                  weight="bold"
                  className="animate-spin text-brand-yellow"
                />
              ) : (
                <FloppyDisk size={16} weight="fill" />
              )}
              {entryMode === "SLOT"
                ? "Utwórz blok usług"
                : isEdit
                  ? "Zapisz zmiany"
                  : "Dodaj punkt"}
            </button>
          </div>
        </footer>
      </motion.aside>
    </>
  );
}
