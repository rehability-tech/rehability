import React from "react";

export default function SpacerBlock({ content }: { content: any }) {
  // Sprawdzamy, czy AI (lub organizator) ustaliło konkretną wysokość.
  // Jeśli nie, dajemy domyślny, przyjemny odstęp 64px (odpowiednik tailwindowego py-16)
  const height = "38px";

  return (
    <div
      aria-hidden="true" // Ukrywamy przed czytnikami ekranu (bo to tylko pusty odstęp)
      style={{ height, width: "100%" }}
      className="block"
    />
  );
}
