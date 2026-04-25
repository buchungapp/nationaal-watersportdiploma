import { randomUUID } from "node:crypto";
import { renderOtpCodeEmail } from "@nawadi/emails";
import { Resend } from "resend";

export const AUTH_OTP_EXPIRES_IN_SECONDS = 60 * 5;

export function getAuthBaseUrl() {
  const baseUrl = process.env.BETTER_AUTH_URL;

  if (!baseUrl) {
    throw new Error("BETTER_AUTH_URL is not configured");
  }

  return baseUrl;
}

export function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not configured");
  }

  return secret;
}

export function resolveTrustedAuthOrigins(): string[] {
  const origins = new Set<string>([new URL(getAuthBaseUrl()).origin]);

  const raw = process.env.AUTH_TRUSTED_ORIGINS;
  if (raw) {
    for (const origin of raw.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

let resendClient: Resend | null = null;

function getResendClient() {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

function getAuthEmailFrom() {
  const from = process.env.AUTH_EMAIL_FROM;
  if (!from) {
    throw new Error("AUTH_EMAIL_FROM is not configured");
  }
  return from;
}

export async function sendAuthOtpEmail(args: { email: string; otp: string }) {
  const expiresInMinutes = AUTH_OTP_EXPIRES_IN_SECONDS / 60;
  const { subject, html, text } = await renderOtpCodeEmail({
    otpCode: args.otp,
    expiresInMinutes,
  });

  const client = getResendClient();

  await client.emails.send({
    from: getAuthEmailFrom(),
    to: args.email,
    subject,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `auth-otp:${randomUUID()}`,
    },
  });
}
