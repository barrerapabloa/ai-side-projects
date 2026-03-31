import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";
import { AnalyzingClient } from "@/components/AnalyzingClient";
import { redirect } from "next/navigation";

export default function AnalyzingPage({
  searchParams,
}: {
  searchParams: { data?: string };
}) {
  if (!searchParams.data) {
    redirect("/");
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] pt-16 sm:pt-20">
        <Card className="px-5 py-8 sm:px-7 sm:py-10">
          <AnalyzingClient dataParam={searchParams.data ?? null} />
        </Card>
      </div>
    </AppShell>
  );
}

