import { Suspense } from "react";
import { ConfirmationClient } from "./confirmation-client";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-zinc-500">Loading confirmation…</p>
      }
    >
      <ConfirmationClient />
    </Suspense>
  );
}
