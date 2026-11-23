import nodemailer, { type Transporter } from "nodemailer";
import { programme } from "@/lib/programme";

/**
 * Free email through a Gmail account (about 500 a day) using a Google App Password.
 * Set GMAIL_USER (e.g. yenepoyaaslpconference@gmail.com) and GMAIL_APP_PASSWORD in Vercel.
 * With either missing, nothing is sent and nothing fails.
 */
export function mailReady(): boolean {
  return gmailUser() !== "" && appPassword() !== "";
}

export function mailSender(): string {
  return gmailUser();
}

function gmailUser(): string {
  return process.env.GMAIL_USER?.trim() ?? "";
}

function appPassword(): string {
  return (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
}

let transport: Transporter | null = null;

export async function sendMail(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}): Promise<{ sent: true } | { sent: false; reason: string }> {
  if (!mailReady()) return { sent: false, reason: "Email is not set up." };
  // SMTP_HOST / SMTP_PORT can point to another provider (or a local test server); Gmail is the default.
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465) || 465;
  transport ??= nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: gmailUser(), pass: appPassword() },
  });
  try {
    await transport.sendMail({
      from: { name: `${programme.title} · Yenepoya ASLP`, address: gmailUser() },
      replyTo: programme.email,
      ...message,
    });
    return { sent: true };
  } catch (error) {
    console.error("mail: send failed", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Sending failed." };
  }
}
