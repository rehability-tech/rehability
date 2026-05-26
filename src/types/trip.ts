// Re-eksport typów Prismy. Po pełnym renamingu schema.prisma → model `Trip`
// nie musimy już mapować nazw — typy są już `Trip*` natywnie w wygenerowanym
// kliencie. Plik zostawiamy jako jeden źródłowy punkt importu typów domeny
// wyjazdu w warstwie aplikacji.

export type {
  Trip,
  TripService,
  TripEvent,
  TripView,
  TripEventType,
  Booking,
} from "@/generated/prisma";
