// src/components/applications/ApplicationCreateDialog.tsx

"use client";

import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ApplicationHeroForm from "@/components/applications/ApplicationHero/ApplicationHeroForm";

export default function ApplicationCreateDialog({
  children,
  contentClassName = "sm:max-w-3xl",
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className={contentClassName}>
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
        </DialogHeader>

        <ApplicationHeroForm
          mode="create"
          onCancel={() => setOpen(false)}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
