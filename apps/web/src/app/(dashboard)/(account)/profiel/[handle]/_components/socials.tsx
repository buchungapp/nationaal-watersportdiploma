import { constants } from "@nawadi/lib";
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
      <Text>Volg het NWD ook op de socials</Text>
      <div className="grid grid-cols-1 @xs/socials:grid-cols-3 gap-2 mt-2">
        <Button
          color="branding-orange"
          href={constants.INSTAGRAM_URL}
          target="_blank"
        >
          <Instagram className="w-4 h-4" />
          Instagram
        </Button>
        <Button
          color="branding-light"
          href={constants.TIKTOK_URL}
          target="_blank"
        >
          <TikTok className="w-4 h-4" />
          TikTok
        </Button>
        <Button
          color="branding-dark"
          href={constants.LINKEDIN_URL}
          target="_blank"
        >
          <LinkedIn className="w-4 h-4" />
          LinkedIn
        </Button>
      </div>
    </StackedLayoutCard>
  );
}
