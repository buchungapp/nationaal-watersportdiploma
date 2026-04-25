import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface OtpCodeEmailProps {
  otpCode: string;
  expiresInMinutes: number;
}

export function OtpCodeEmail({ otpCode, expiresInMinutes }: OtpCodeEmailProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Je NWD-inlogcode: {otpCode}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[480px] px-6 py-8">
            <Heading className="text-[22px] font-semibold text-slate-900">
              Inloggen bij het Nationaal Watersportdiploma
            </Heading>
            <Text className="text-[15px] leading-6 text-slate-700">
              Gebruik onderstaande code om in te loggen. De code is{" "}
              {expiresInMinutes} minuten geldig.
            </Text>
            <Section className="my-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
              <Text className="m-0 font-mono text-[28px] tracking-[0.4em] font-bold text-slate-900">
                {otpCode}
              </Text>
            </Section>
            <Text className="text-[13px] leading-5 text-slate-500">
              Heb je deze e-mail niet aangevraagd? Dan kun je deze negeren. Deel
              deze code met niemand.
            </Text>
            <Hr className="my-6 border-slate-200" />
            <Text className="text-[12px] leading-5 text-slate-500">
              Nationaal Watersportdiploma · nationaalwatersportdiploma.nl
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OtpCodeEmail.PreviewProps = {
  otpCode: "123456",
  expiresInMinutes: 5,
} satisfies OtpCodeEmailProps;

export default OtpCodeEmail;
