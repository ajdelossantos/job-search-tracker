"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/tailwind-utils";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

export type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** shadcn Button variant for the confirm button */
  variant?: ButtonVariant;
  /** Optional passthrough props for the two buttons */
  actionProps?: Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "children" | "variant"
  >;
  cancelProps?: Omit<
    React.ComponentProps<typeof Button>,
    "onClick" | "children" | "variant"
  >;
};

type ResolvedOptions = {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: ButtonVariant;
  actionProps?: ConfirmOptions["actionProps"];
  cancelProps?: ConfirmOptions["cancelProps"];
};

export function useConfirm() {
  const [open, setOpen] = React.useState(false);
  const resolveRef =
    React.useRef<(value: boolean) => void | undefined>(undefined);
  const optsRef = React.useRef<ResolvedOptions>({
    title: "Are you sure?",
    description: "",
    confirmText: "Continue",
    cancelText: "Cancel",
    variant: "default",
  });

  const confirm = React.useCallback((opts: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      // Save options first so there’s no “default text” flash
      optsRef.current = {
        title: opts.title ?? "Are you sure?",
        description: opts.description ?? "",
        confirmText: opts.confirmText ?? "Continue",
        cancelText: opts.cancelText ?? "Cancel",
        variant: opts.variant ?? "default",
        actionProps: opts.actionProps,
        cancelProps: opts.cancelProps,
      };
      resolveRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const close = React.useCallback((val: boolean) => {
    setOpen(false);
    resolveRef.current?.(val);
    resolveRef.current = undefined;
  }, []);

  const ConfirmDialog = React.useCallback(
    function ConfirmDialog() {
      const o = optsRef.current;
      return (
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            if (!next) close(false);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{o.title}</AlertDialogTitle>
              {o.description ? (
                <AlertDialogDescription>{o.description}</AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel
                // make Cancel look like an outline button
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  o.cancelProps?.className,
                )}
                onClick={() => close(false)}
                {...o.cancelProps}
              >
                {o.cancelText ?? "Cancel"}
              </AlertDialogCancel>

              <AlertDialogAction
                // this is where we apply the destructive style DIRECTLY
                className={cn(
                  buttonVariants({ variant: o.variant ?? "default" }),
                  o.actionProps?.className,
                )}
                onClick={() => close(true)}
                {...o.actionProps}
              >
                {o.confirmText ?? "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
    [open, close],
  );

  return { confirm, ConfirmDialog };
}
