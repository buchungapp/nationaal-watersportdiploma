"use client";
import { toast } from "sonner";

import { useAction } from "next-safe-action/hooks";
import { useFormStatus } from "react-dom";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { FieldGroup, Fieldset } from "~/app/(dashboard)/_components/fieldset";
import { Input, InputGroup } from "~/app/(dashboard)/_components/input";
import { TextLink } from "~/app/(dashboard)/_components/text";
import { useFormInput } from "~/app/_actions/hooks/useFormInput";
import { updateLocationSocialsAction } from "~/app/_actions/location/update-location-socials-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "~/app/_actions/utils";
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
import Spinner from "~/app/_components/spinner";
import type { retrieveLocationByHandle } from "~/lib/nwd";
import { FieldSection } from "./field-selection";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button color="branding-dark" disabled={pending} type="submit">
      {pending ? <Spinner className="text-white" /> : null}
      Opslaan
    </Button>
  );
}

export default function SocialsForm({
  className,
  locationId,
  googlePlaceId,
  socialMedia,
}: {
  className?: string;
  locationId: string;
  googlePlaceId: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["googlePlaceId"];
  socialMedia: Awaited<
    ReturnType<typeof retrieveLocationByHandle>
  >["socialMedia"];
}) {
  const findSocialMediaUrl = (
    platform: (typeof socialMedia)[number]["platform"],
  ) => socialMedia.find((media) => media.platform === platform)?.url;

  const { execute, input } = useAction(
    updateLocationSocialsAction.bind(null, locationId),
    {
      onSuccess: () => {
        toast.success("Instellingen zijn geüpdatet.");
      },
      onError: () => {
        toast.error(DEFAULT_SERVER_ERROR_MESSAGE);
      },
    },
  );

  const { getInputValue } = useFormInput(input, {
    googlePlaceId: googlePlaceId,
    "socials-facebook": findSocialMediaUrl("facebook"),
    "socials-instagram": findSocialMediaUrl("instagram"),
    "socials-linkedin": findSocialMediaUrl("linkedin"),
    "socials-tiktok": findSocialMediaUrl("tiktok"),
    "socials-whatsapp": findSocialMediaUrl("whatsapp"),
    "socials-x": findSocialMediaUrl("x"),
    "socials-youtube": findSocialMediaUrl("youtube"),
  });

  return (
    <form className={className} action={execute}>
      <Fieldset>
        <FieldGroup>
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
                . Wordt gebruikt voor het tonen van de locatie op de vaarlocatie
                kaart.
              </span>
            }
          >
            <InputGroup>
              <Google data-slot="icon" />
              <Input
                name="googlePlaceId"
                defaultValue={getInputValue("googlePlaceId") ?? undefined}
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
                defaultValue={getInputValue("socials-facebook") ?? undefined}
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
                defaultValue={getInputValue("socials-instagram") ?? undefined}
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
                defaultValue={getInputValue("socials-linkedin") ?? undefined}
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
                defaultValue={getInputValue("socials-tiktok") ?? undefined}
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
                defaultValue={getInputValue("socials-whatsapp") ?? undefined}
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
                defaultValue={getInputValue("socials-x") ?? undefined}
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
                defaultValue={getInputValue("socials-youtube") ?? undefined}
                type="url"
                placeholder="https://www.youtube.com/[kanaal]"
              />
            </InputGroup>
          </FieldSection>
        </FieldGroup>
      </Fieldset>

      <Divider soft className="my-10" />
      <div className="flex justify-end gap-4">
        <Button plain type="reset">
          Reset
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
