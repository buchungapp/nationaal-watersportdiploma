import { Avatar } from "~/app/(dashboard)/_components/avatar";
import { getUserOrThrow } from "~/lib/nwd";

export async function UserAvatar() {
  const user = await getUserOrThrow();

  return (
    <Avatar initials={(user.displayName ?? user.email).slice(0, 2)} square />
  );
}

export async function UserAvatarFallback() {
  return <Avatar initials="..." square />;
}
