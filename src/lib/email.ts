import nodemailer from "nodemailer";

function getSmtpTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) return null;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

async function sendEmail(input: { to: string; subject: string; html: string; text?: string }) {
  const from = process.env.EMAIL_FROM || "PayTrack AI <no-reply@paytrack.local>";
  const smtp = getSmtpTransport();
  if (!smtp) {
    console.warn("Email not configured (set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)");
    return { success: false, error: "Email not configured" };
  }

  const info = await smtp.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
  return { success: true, data: { provider: "smtp", messageId: info.messageId } };
}

export async function sendDueDateReminder(
  to: string,
  userName: string,
  cardName: string,
  dueDate: Date,
  amount: string,
  daysUntilDue?: number
) {
  const daysText = daysUntilDue === 1 ? "tomorrow" : daysUntilDue ? `in ${daysUntilDue} days` : "soon";
  const subject = `Payment Reminder: ${cardName} due ${daysText}`;

  return await sendEmail({
    to,
    subject,
    text: `Hi ${userName || "there"},\n${cardName} is due on ${dueDate.toLocaleDateString()}.\nAmount due: $${amount}\n`,
    html: `
      <h2>Payment Reminder from PayTrack AI</h2>
      <p>Hi ${userName || "there"},</p>
      <p>This is a friendly reminder that your <strong>${cardName}</strong> payment is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
      <p>Amount due: <strong>$${amount}</strong></p>
      <p>Don't forget to make your payment on time to avoid late fees!</p>
      <p>PayTrack AI</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, userName: string, resetUrl: string) {
  const subject = "Reset your PayTrack AI password";

  return await sendEmail({
    to,
    subject,
    text: `Hi ${userName || "there"},\nReset link: ${resetUrl}\n`,
    html: `
      <h2>Reset Your Password</h2>
      <p>Hi ${userName || "there"},</p>
      <p>We received a request to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}" style="color:#0d9488;font-weight:600">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      <p>PayTrack AI</p>
    `,
  });
}

export async function sendEmailVerificationEmail(to: string, userName: string, verifyUrl: string) {
  const subject = "Verify your PayTrack AI email";

  return await sendEmail({
    to,
    subject,
    text: `Hi ${userName || "there"},\nVerify link: ${verifyUrl}\n`,
    html: `
      <h2>Verify Your Email</h2>
      <p>Hi ${userName || "there"},</p>
      <p>Thanks for signing up! Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="color:#0d9488;font-weight:600">Verify email</a></p>
      <p>This link expires in 24 hours.</p>
      <p>PayTrack AI</p>
    `,
  });
}
