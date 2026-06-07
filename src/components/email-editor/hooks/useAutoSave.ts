import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved";

export function useAutoSave(saveFn: () => Promise<void>, delay = 30_000) {
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<AutoSaveStatus>("idle");

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus("pending");
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveFnRef.current();
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } catch {
        setStatus("idle");
      }
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { schedule, status };
}
