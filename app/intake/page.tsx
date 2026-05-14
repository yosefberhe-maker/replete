import IntakeWizard from "@/components/IntakeWizard";
import { RepleteWordmark } from "@/components/RepleteWordmark";

export const metadata = {
  title: "Your 2-minute intake",
  description:
    "Answer 5 questions about your GLP-1 regimen to receive your personalized deficiency profile.",
};

export default function IntakePage() {
  return (
    <main className="min-h-dvh bg-bg pb-20 pt-6">
      <header className="container-page mb-8 flex items-center justify-between">
        <RepleteWordmark />
        <span className="text-xs text-muted">Your profile · private to you</span>
      </header>
      <IntakeWizard />
    </main>
  );
}
