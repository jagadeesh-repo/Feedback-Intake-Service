"use client";

import { useFormStatus } from "react-dom";

/**
 * Submit button for the feedback form. Uses the form's pending state to disable
 * itself and show a spinner while the server action is in flight, so a user
 * can't fire duplicate submissions during the round-trip. The
 * peer-placeholder-shown classes keep it greyed out while the textarea is empty.
 */
export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex items-center gap-2 self-start rounded border bg-foreground px-4 py-2 text-sm font-medium text-background peer-placeholder-shown:pointer-events-none peer-placeholder-shown:opacity-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
        />
      )}
      {pending ? "Submitting…" : "Submit"}
    </button>
  );
}
