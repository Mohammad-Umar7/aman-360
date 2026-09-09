import { Hero } from "@/components/landing/Hero";
import { Answers, Channels, Footer, Future, Layers, Privacy, Storyline, Twin } from "@/components/landing/Sections";

export default function LandingPage() {
  return (
    <main className="bg-bg-0 text-ink">
      <Hero />
      <Answers />
      <Layers />
      <Storyline />
      <Twin />
      <Channels />
      <Privacy />
      <Future />
      <Footer />
    </main>
  );
}
