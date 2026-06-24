import type {
  CourseBlock,
  CourseFaq,
  CourseReview,
} from "@/app/(site)/kursy/_data/courses";

/** Serializowalny kształt danych kursu przekazywany do dashboardu (klient). */
export type DashboardData = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  price: number;
  durationMin: number;
  rating: number;
  reviews: number;
  status: string;
  format: string;
  image: string;
  video: string | null;
  createdAt: string;
  updatedAt: string;
  description: CourseBlock[] | null;
  testimonials: CourseReview[] | null;
  faq: CourseFaq[] | null;
  // SEO / Open Graph
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  ogImage: string;
  canonicalUrl: string;
  noIndex: boolean;
  /** Podpisany kadr z nagrania (Bunny) do ustawienia jako okładka. Pusty, gdy brak wideo. */
  videoThumb: string;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      description: string | null;
      video: string | null;
    }[];
  }[];
  stats: {
    students: number;
    revenue: number;
    modulesCount: number;
    lessonsCount: number;
    lessonsWithVideo: number;
  };
};

// Edycja danych/treści/programu odbywa się w kreatorze (trasa /edytuj), więc
// dashboard ma już tylko dwie zakładki przeglądowe.
export type CourseTab = "overview" | "participants";

/** Wiersz uczestnika kursu (serializowalny — daty jako ISO). */
export type ParticipantRow = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  enrolledAt: string;
  lessonsCompleted: number;
  progress: number;
  watchSeconds: number;
  lastActivity: string | null;
};

export type ParticipantsData = {
  lessonsTotal: number;
  participants: ParticipantRow[];
};
