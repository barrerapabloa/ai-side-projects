import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { QuizClient } from "@/components/QuizClient";

export default function QuizPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] pt-16 sm:pt-20">
        <Card className="px-5 py-6 sm:px-7 sm:py-8">
          <QuizClient />
        </Card>
      </div>
    </AppShell>
  );
}

