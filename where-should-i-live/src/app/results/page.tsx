import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { ResultsClient } from "@/components/ResultsClient";

function ResultsFallback() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[486px] pt-14 text-center text-sm text-muted sm:pt-18">
        Loading results…
      </div>
    </AppShell>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsFallback />}>
      <ResultsClient />
    </Suspense>
  );
}
