"use client";

import { Toaster } from "sonner";

/**
 * AppToaster component that renders a toast notification system.
 *
 * @returns A Toaster component configured with:
 * - Position: bottom-left of the screen
 * - Rich colors enabled for different toast types
 * - Close button for manual dismissal
 * - Non-expanding behavior
 * - 3.5 second duration for all toasts
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
