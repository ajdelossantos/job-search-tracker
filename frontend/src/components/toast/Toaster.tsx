"use client";

import { Toaster } from "sonner";

/**
 * Toast notification component.
 */
export default function AppToaster() {
  return (
    <Toaster
      position="bottom-left"
      richColors
      closeButton
      expand={false}
      toastOptions={{ duration: 3500 }}
    />
  );
}
