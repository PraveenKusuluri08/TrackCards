import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendDueDateReminder(
  to: string,
  userName: string,
  cardName: string,
  dueDate: Date,
  amount: string,
  daysUntilDue?: number
) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email");
    return { success: false, error: "Email not configured" };
  }

  const daysText = daysUntilDue === 1 ? "tomorrow" : daysUntilDue ? `in ${daysUntilDue} days` : "soon";
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "PayTrack AI <onboarding@resend.dev>",
    to: [to],
    subject: `Payment Reminder: ${cardName} due ${daysText}`,
    html: `
      <h2>Payment Reminder from PayTrack AI</h2>
      <p>Hi ${userName || "there"},</p>
      <p>This is a friendly reminder that your <strong>${cardName}</strong> payment is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
      <p>Amount due: <strong>$${amount}</strong></p>
      <p>Don't forget to make your payment on time to avoid late fees!</p>
      <p>— PayTrack AI</p>
    `,
  });

  if (error) {
    console.error("Failed to send reminder email:", error);
    return { success: false, error };
  }

  return { success: true, data };
}

export async function sendPasswordResetEmail(to: string, userName: string, resetUrl: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email");
    return { success: false, error: "Email not configured" };
  }
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "PayTrack AI <onboarding@resend.dev>",
    to: [to],
    subject: "Reset your PayTrack AI password",
    html: `
      <h2>Reset Your Password</h2>
      <p>Hi ${userName || "there"},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color:#0d9488;font-weight:600">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      <p>— PayTrack AI</p>
    `,
  });
  if (error) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error };
  }
  return { success: true, data };
}

export async function sendEmailVerificationEmail(to: string, userName: string, verifyUrl: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set - skipping email");
    return { success: false, error: "Email not configured" };
  }
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "PayTrack AI <onboarding@resend.dev>",
    to: [to],
    subject: "Verify your PayTrack AI email",
    html: `
      <h2>Verify Your Email</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Thanks for signing up! Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="color:#0d9488;font-weight:600">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
      <p>— PayTrack AI</p>
    `,
  });
  if (error) {
    console.error("Failed to send verification email:", error);
    return { success: false, error };
  }
  return { success: true, data };
}
