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
import { Input } from "~/app/(dashboard)/_components/input";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { Textarea } from "~/app/(dashboard)/_components/textarea";
import { retrieveLocationByHandle } from "~/lib/nwd";
import SettingsForm from "./_components/settings-form";

function FieldSection({
  label,
  description,
  children,
}: PropsWithChildren<{
  label: React.ReactNode;
  description: React.ReactNode;
}>) {
  return (
    <Headless.Field
      as="section"
      className="grid gap-x-8 gap-y-6 sm:grid-cols-2"
    >
      <div className="space-y-1">
        <Label>{label}</Label>
        <Description>{description}</Description>
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
  } = location;

  return (
    <SettingsForm className="mx-auto max-w-4xl">
      <Heading>Instellingen</Heading>
      <Text>
        Deze informatie wordt gedeeltelijk ook openbaar getoond op{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          de website
        </TextLink>
        .
      </Text>
      <Divider className="my-10" />

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
        <Input name="email" defaultValue={undefined} type="email" />
      </FieldSection>

      <Divider soft className="my-10" />

      <FieldSection
        label="Website"
        description="Waar kunnen deelnemers meer informatie vinden?"
      >
        <Input
          name="websiteUrl"
          defaultValue={websiteUrl ?? undefined}
          type="url"
        />
      </FieldSection>

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
          <FieldSection
            label="Standaard"
            description="Het algemene logo van de vaarlocatie."
          >
            <img src={logo?.url} className="w-full h-auto" />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Icoon"
            description="Een kleine vierkante versie van het logo, die wordt gebruik op plekken met minder ruimte. Kan zowel vierkant als rond weergegeven worden."
          >
            <img src={logoSquare?.url} className="w-full h-auto" />
          </FieldSection>

          <Divider soft className="my-10" />

          <FieldSection
            label="Diploma"
            description="Het logo zoals hij geprint wordt op diploma's."
          >
            <img src={logoCertificate?.url} className="w-full h-auto" />
          </FieldSection>
        </FieldGroup>
      </Fieldset>

      <Divider soft className="my-10" />
    </SettingsForm>
  );
}
