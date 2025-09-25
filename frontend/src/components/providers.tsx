"use client";

import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/utils/get-query-client";
import TimezoneProvider from "@/components/timezone/TimezoneProvider";
import AppToaster from "@/components/toast/Toaster";

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TimezoneProvider>{children}</TimezoneProvider>
      <AppToaster />
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
