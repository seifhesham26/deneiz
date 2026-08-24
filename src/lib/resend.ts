/**
 * PROTOTYPE: transactional email via Resend is stubbed. Without an API key
 * emails are logged instead of sent, keeping local flows unblocked.
 */
import { env } from "@/env";
import { captureException } from "@/lib/sentry";

interface OrderEmailPayload {
  orderNumber: string;
  recipientEmail: string | null;
  total: number;
}

export async function sendOrderConfirmationEmail(
  payload: OrderEmailPayload,
): Promise<void> {
  if (!env.resendApiKey || !payload.recipientEmail) {
    console.info(
      `[email-stub] order confirmation for ${payload.orderNumber} skipped (no key or recipient)`,
    );
    return;
  }

  try {
    // PROTOTYPE: replace with resend.emails.send once key exists
    console.info(`[email-stub] confirmation for ${payload.orderNumber}`);
  } catch (error) {
    // Emails must never fail the checkout flow — report and move on
    captureException(error);
  }
}
