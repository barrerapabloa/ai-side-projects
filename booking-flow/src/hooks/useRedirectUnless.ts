"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useRedirectUnless(ok: boolean, href: string) {
  const router = useRouter();
  useEffect(() => {
    if (!ok) router.replace(href);
  }, [ok, href, router]);
}
