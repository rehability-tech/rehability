import {
  Lightning,
  Fire,
  Certificate,
  Trophy,
  Medal,
} from "@phosphor-icons/react/dist/ssr";

// Cel nauki (liczba lekcji do "celu").
export const WEEKLY = { goal: 5 };

// Gamifikacja liczona z realnych ukończonych lekcji.
export function buildGamification(lessonsDone: number, certificates: number) {
  const points = lessonsDone * 50; // 50 XP / lekcję
  const level = Math.floor(points / 400) + 1;
  const xpToNext = level * 400;
  return { lessonsDone, points, certificates, level, xp: points, xpToNext };
}

export type Gamification = ReturnType<typeof buildGamification>;

// Odznaki — odblokowanie z realnych danych użytkownika.
export function buildAchievements(
  lessonsDone: number,
  completedCourses: number,
  coursesCount: number,
) {
  return [
    { icon: Lightning, label: "Pierwsza lekcja", unlocked: lessonsDone >= 1, tint: "yellow" },
    { icon: Fire, label: "5 lekcji", unlocked: lessonsDone >= 5, tint: "rose" },
    { icon: Certificate, label: "Pierwszy certyfikat", unlocked: completedCourses >= 1, tint: "primary" },
    { icon: Trophy, label: "3 kursy", unlocked: coursesCount >= 3, tint: "primary" },
    { icon: Medal, label: "10 kursów", unlocked: coursesCount >= 10, tint: "primary" },
  ] as const;
}

export type Achievement = ReturnType<typeof buildAchievements>[number];
