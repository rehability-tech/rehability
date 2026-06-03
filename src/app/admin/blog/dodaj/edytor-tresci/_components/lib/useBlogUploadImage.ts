import { useState } from "react";

export function useBlogUploadImage(
  onUploadSuccess: (url: string) => void,
  endpoint: string = "/api/admin/blog/upload",
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await fetch(`${endpoint}?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      if (!res.ok) throw new Error("Błąd podczas przesyłania");
      const data = await res.json();
      onUploadSuccess(data.url);
    } catch {
      setUploadError("Nie udało się przesłać zdjęcia. Sprawdź plik.");
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadError };
}
