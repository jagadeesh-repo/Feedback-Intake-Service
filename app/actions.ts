"use server";

import { revalidatePath } from "next/cache";
import { SubmitFeedbackRequestSchema } from "@/lib/schema";
import { createFeedbackRecord } from "@/lib/submit-feedback";

/**
 * Server action backing the dashboard's submission form. Runs on the server,
 * reuses the same createFeedbackRecord path as the typed API route, and
 * revalidates the dashboard so a new record appears immediately. Native
 * `required`/`maxLength` on the textarea guard invalid input in the browser;
 * the schema check here is the server-side backstop.
 */
export async function submitFeedbackAction(formData: FormData) {
  const parsed = SubmitFeedbackRequestSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return;
  }

  await createFeedbackRecord(parsed.data.text);
  revalidatePath("/");
}
