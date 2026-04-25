import { render } from "@react-email/render";
import { OtpCodeEmail, type OtpCodeEmailProps } from "./templates/otp-code.js";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export async function renderOtpCodeEmail(
  props: OtpCodeEmailProps,
): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([
    render(OtpCodeEmail(props)),
    render(OtpCodeEmail(props), { plainText: true }),
  ]);

  return {
    subject: `Je NWD-inlogcode: ${props.otpCode}`,
    html,
    text,
  };
}
