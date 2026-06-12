import React from "react";
import { redirect } from "next/navigation";

// Sekcja „Wyjazdy" jest tymczasowo wyłączona i niedostępna publicznie.
// Redirect w layoucie blokuje wejście zarówno na /wyjazdy, jak i /wyjazdy/[slug].
// Aby przywrócić: usuń redirect i odkomentuj poprzedni layout (Navbar + Footer).

export default function WyjazdyLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect("/");
}
