"use client";

import { createContext, useContext, useEffect, useId } from "react";

/** Stan pojedynczego przesyłania: czy trwa + postęp 0–100. */
export type UploadInfo = { active: boolean; progress: number };

/** Rejestr aktywnych przesyłań wideo — kreator liczy je (ile materiałów leci)
 *  i agreguje postęp, by pokazać to w pasku akcji. */
export type UploadTracker = (id: string, info: UploadInfo) => void;

export const UploadTrackerContext = createContext<UploadTracker | null>(null);

/**
 * Hook dla VideoUploadera: zgłasza, czy trwa przesyłanie (faza „uploading")
 * oraz jego postęp. Każdy uploader ma własne, stabilne `id`, więc kreator widzi
 * WSZYSTKIE równoległe przesyłania (tryb modułowy = wiele lekcji naraz).
 * Poza kreatorem (brak providera) jest no-opem.
 */
export function useReportUpload(active: boolean, progress = 0) {
  const report = useContext(UploadTrackerContext);
  const id = useId();
  useEffect(() => {
    report?.(id, { active, progress });
    return () => report?.(id, { active: false, progress: 0 });
  }, [report, id, active, progress]);
}
