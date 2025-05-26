import clsx from "clsx";
import { Button } from "~/app/(dashboard)/_components/button";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { Instagram, LinkedIn, TikTok } from "~/app/_components/socials";

export function Socials({ className }: { className?: string }) {
  return (
    <StackedLayoutCard
      transparent
      className={clsx("@container/socials", className)}
    >
      <Text className="@max-sm/socials:text-center">
        Volg het NWD ook op sociale media
      </Text>
      <div className="flex @sm/socials:flex-row flex-col gap-2 mt-2">
        <Button color="branding-orange">
          <Instagram />
          Instagram
        </Button>
        <Button color="branding-light">
          <TikTok />
          TikTok
        </Button>
        <Button color="branding-dark">
          <LinkedIn />
          LinkedIn
        </Button>
      </div>
    </StackedLayoutCard>
  );
}
