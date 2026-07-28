import { useState } from "react";

export function useUploadImage(
  tripId: string,
  onUploadSuccess: (url: string) => void,
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      // Wykorzystujemy ten sam "Smart Endpoint" SEO, który zrobiliśmy!
      const response = await fetch(
        `/api/admin/wydarzenia/${tripId}/upload?filename=${file.name}`,
        {
          method: "POST",
          body: file,
        },
      );

      if (!response.ok) {
        throw new Error("Błąd podczas przesyłania zdjęcia");
      }

      const responseData = await response.json();
      onUploadSuccess(responseData.url); // Przekazujemy link z chmury do bloku
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadError("Nie udało się przesłać zdjęcia. Sprawdź plik.");
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, uploadError };
}
