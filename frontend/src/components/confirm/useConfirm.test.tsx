import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

function Demo({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button>Delete</button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete contact?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe("AlertDialog", () => {
  it("opens and confirms", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<Demo onConfirm={onConfirm} />);

    await user.click(screen.getByText("Delete"));
    // Dialog content appears (ported to body)
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/delete contact\?/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /confirm/i }));
    // Confirm triggers close; assert callback fired
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    // And the dialog disappears
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
  });
});
