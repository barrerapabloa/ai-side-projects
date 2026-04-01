import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { AnalyzingClient } from "@/components/AnalyzingClient";

function AnalyzingFallback() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="text-xs text-muted">Analyzing your life…</div>
      <div className="serifTitle mt-3 text-[36px] font-normal leading-[1.05]">
        Finding your cities
      </div>
      <p className="mt-3 text-sm text-muted">Loading…</p>
    </div>
  );
}

export default function AnalyzingPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] pt-16 sm:pt-20">
        <Card className="px-5 py-8 sm:px-7 sm:py-10">
          <Suspense fallback={<AnalyzingFallback />}>
            <AnalyzingClient />
          </Suspense>
        </Card>
      </div>
    </AppShell>
  );
}
