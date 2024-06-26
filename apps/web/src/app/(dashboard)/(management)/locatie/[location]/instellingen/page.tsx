import * as Headless from "@headlessui/react";
import type { PropsWithChildren } from "react";
import React from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  Description,
  FieldGroup,
  Fieldset,
  Label,
  Legend,
} from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Input, InputGroup } from "~/app/(dashboard)/_components/input";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import {
  Facebook,
  Google,
  Instagram,
  LinkedIn,
  TikTok,
  Whatsapp,
  X,
  YouTube,
} from "~/app/_components/socials";
import { retrieveLocationByHandle } from "~/lib/nwd";
import { ImageUpload } from "./_components/image-upload";
import SettingsForm from "./_components/settings-form";
import SocialsForm from "./_components/socials-form";

function FieldSection({
  label,
  description,
  children,
}: PropsWithChildren<{
  label: React.ReactNode;
  description?: React.ReactNode;
}>) {
  return (
    <Headless.Field
      as="section"
      className="grid gap-x-8 gap-y-6 sm:grid-cols-2"
    >
      <div className="space-y-1">
        <Label>{label}</Label>
        {description ? <Description>{description}</Description> : null}
      </div>
      <div>{children}</div>
    </Headless.Field>
  );
}

export default async function Page({
  params,
}: Readonly<{
  params: {
    location: string;
  };
}>) {
  const location = await retrieveLocationByHandle(params.location);

  const {
    name,
    shortDescription,
    websiteUrl,
    logo,
    logoSquare,
    logoCertificate,
    email,
    googlePlaceId,
    socialMedia,
  } = location;

  const findSocialMediaUrl = (
    platform: (typeof socialMedia)[number]["platform"],
  ) => socialMedia.find((media) => media.platform === platform)?.url;

  return (
    <div className="mx-auto max-w-4xl">
      <Heading>Instellingen</Heading>
      <Text>
        Deze informatie wordt gedeeltelijk ook openbaar getoond op{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          de website
        </TextLink>
        .
      </Text>
      <Divider className="my-10" />

      <SettingsForm locationId={location.id}>
        <FieldSection
          label="Naam"
          description="De naam zoals deze getoond wordt op de website."
        >
          <Input name="name" defaultValue={name ?? undefined} required />
        </FieldSection>

        <Divider soft className="my-10" />

        <FieldSection
          label="Bio"
          description="Een korte omschrijving zoals deze getoond wordt op de website. Maximaal 260 karakters."
        >
          <Textarea
            name="shortDescription"
            defaultValue={shortDescription ?? undefined}
            rows={3}
            maxLength={260}
          />
        </FieldSection>

        <Divider soft className="my-10" />

        <FieldSection
          label="E-mail"
          description="Hoe kunnen deelnemers contact met jullie opnemen?"
        >
          <Input
            name="email"
            defaultValue={email ?? undefined}
            type="email"
            required
          />
        </FieldSection>

        <Divider soft className="my-10" />

        <FieldSection
          label="Website"
          description="Waar kunnen deelnemers meer informatie vinden?"
        >
          <Input
            name="websiteUrl"
            defaultValue={websiteUrl ?? undefined}
            required
            type="url"
          />
        </FieldSection>
      </SettingsForm>

      <Divider className="my-12" />

      <Fieldset>
        <Legend>
          <Subheading className="select-none">Logo's</Subheading>
        </Legend>
        <Text>
          We gebruiken verschillende variaties. Zorg dat ze allemaal up-to-date
          zijn.
        </Text>

        <FieldGroup>
          <Divider soft className="my-10" />

          <FieldSection
            label="Standaard"
            description="Het algemene logo van de vaarlocatie."
          >
            <ImageUpload />
            <img src={logo?.url} className="w-full h-auto" />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Icoon"
            description="Een kleine vierkante versie van het logo, die wordt gebruik op plekken met minder ruimte. Kan zowel vierkant als rond weergegeven worden."
          >
            <ImageUpload />
            <img src={logoSquare?.url} className="w-full h-auto" />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Diploma"
            description="Het logo zoals hij geprint wordt op diploma's."
          >
            <ImageUpload />

            <img src={logoCertificate?.url} className="w-full h-auto" />
          </FieldSection>
        </FieldGroup>
      </Fieldset>

      <Divider className="my-12" />

      <SocialsForm locationId={location.id}>
        <Fieldset>
          <Legend>
            <Subheading className="select-none">Socials</Subheading>
          </Legend>
          <Text>Beheer de links naar verschillende social media kanalen.</Text>

          <FieldGroup>
            <Divider soft className="my-10" />

            <FieldSection
              label="Google Place ID"
              description={
                <span>
                  Te vinden via{" "}
                  <TextLink
                    href="https://developers.google.com/maps/documentation/places/web-service/place-id#find-id"
                    target="_blank"
                  >
                    developers.google.com
                  </TextLink>
                  . Wordt gebruikt voor het tonen van de locatie op de
                  vaarlocatie kaart.
                </span>
              }
            >
              <InputGroup>
                <Google data-slot="icon" />
                <Input
                  name="googlePlaceId"
                  defaultValue={googlePlaceId ?? undefined}
                  type="text"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="Facebook">
              <InputGroup>
                <Facebook data-slot="icon" />
                <Input
                  name="socials-facebook"
                  defaultValue={findSocialMediaUrl("facebook") ?? undefined}
                  type="url"
                  placeholder="https://www.facebook.com/[pagina]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="Instagram">
              <InputGroup>
                <Instagram data-slot="icon" />
                <Input
                  name="socials-instagram"
                  defaultValue={findSocialMediaUrl("instagram") ?? undefined}
                  type="url"
                  placeholder="https://www.instagram.com/[account]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="LinkedIn">
              <InputGroup>
                <LinkedIn data-slot="icon" />
                <Input
                  name="socials-linkedin"
                  defaultValue={findSocialMediaUrl("linkedin") ?? undefined}
                  type="url"
                  placeholder="https://www.linkedin.com/company/[bedrijfsnaam]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="TikTok">
              <InputGroup>
                <TikTok data-slot="icon" />
                <Input
                  name="socials-tiktok"
                  defaultValue={findSocialMediaUrl("tiktok") ?? undefined}
                  type="url"
                  placeholder="https://www.tiktok.com/@[account]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="WhatsApp">
              <InputGroup>
                <Whatsapp data-slot="icon" />
                <Input
                  name="socials-whatsapp"
                  defaultValue={findSocialMediaUrl("whatsapp") ?? undefined}
                  type="url"
                  placeholder="https://wa.me/[telefoonnummer]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="X">
              <InputGroup>
                <X data-slot="icon" />
                <Input
                  name="socials-x"
                  defaultValue={findSocialMediaUrl("x") ?? undefined}
                  type="url"
                  placeholder="https://x.com/[account]"
                />
              </InputGroup>
            </FieldSection>

            <Divider soft className="my-10" />

            <FieldSection label="YouTube">
              <InputGroup>
                <YouTube data-slot="icon" />
                <Input
                  name="socials-youtube"
                  defaultValue={findSocialMediaUrl("youtube") ?? undefined}
                  type="url"
                  placeholder="https://www.youtube.com/[kanaal]"
                />
              </InputGroup>
            </FieldSection>
          </FieldGroup>
        </Fieldset>
      </SocialsForm>
    </div>
  );
}
