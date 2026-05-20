import { BlogGrid } from "./_components/BlogGrid";

export const metadata = {
  title: "Blog | Rehability",
  description:
    "Sprawdzona wiedza z zakresu fizjoterapii, mindfulness i zdrowego stylu życia — pisana przez specjalistów Rehability.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen pb-24">
      <BlogGrid />
    </main>
  );
}
