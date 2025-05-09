import { Suspense } from "react";
import { getUserOrThrow } from "~/lib/nwd";
import { Avatar } from "./avatar";

export function UserAvatar() {
  return (
    <Suspense fallback={<Avatar initials="..." square />}>
      <UserAvatarContent />
    </Suspense>
  );
}

async function UserAvatarContent() {
  const user = await getUserOrThrow();

  return (
    <Avatar initials={(user.displayName ?? user.email).slice(0, 2)} square />
  );
}
