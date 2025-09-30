"use client";

import * as React from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils/tailwind-utils";

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
};

/**
 * A custom React hook that provides a programmatic confirmation dialog.
 *
 * @param defaults - Default options to apply to all confirmation dialogs created by this hook
 * @returns An object containing:
 *   - `confirm`: A function that shows the confirmation dialog and returns a Promise<boolean>
 *   - `ConfirmDialog`: A React element representing the dialog component that should be rendered in your component tree
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { confirm, ConfirmDialog } = useConfirm({
 *     title: 'Delete Item',
 *     variant: 'danger'
 *   });
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       description: 'This action cannot be undone.'
 *     });
 *     if (confirmed) {
 *       // Perform delete action
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleDelete}>Delete</button>
 *       {ConfirmDialog}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConfirm(defaults?: ConfirmOptions) {
  const [opts, setOpts] = React.useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = React.useState<
    ((ok: boolean) => void) | null
  >(null);

  const confirm = React.useCallback(
    (options?: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        setResolver(() => resolve);
        setOpts({ ...defaults, ...options });
      });
    },
    [defaults],
  );

  const onClose = (ok: boolean) => {
    resolver?.(ok);
    setResolver(null);
    setOpts(null);
  };

  const Dialog = (
    <AlertDialog.Root open={!!opts} onOpenChange={(o) => !o && onClose(false)}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border bg-white p-5 shadow-xl",
          )}
        >
          <AlertDialog.Title className="text-lg font-semibold">
            {opts?.title ?? "Are you sure?"}
          </AlertDialog.Title>
          {opts?.description ? (
            <AlertDialog.Description className="mt-2 text-sm text-gray-600">
              {opts.description}
            </AlertDialog.Description>
          ) : null}

          <div className="mt-5 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={() => onClose(false)}
              >
                {opts?.cancelText ?? "Cancel"}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-1.5 text-sm text-white",
                  opts?.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-black hover:bg-black/90",
                )}
                onClick={() => onClose(true)}
              >
                {opts?.confirmText ?? "Confirm"}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return { confirm, ConfirmDialog: Dialog } as const;
}
