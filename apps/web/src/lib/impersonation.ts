import { isSystemAdmin } from "./authorization";

export function assertCanUseImpersonation(
  operatorEmail: string | null | undefined,
) {
  if (!isSystemAdmin(operatorEmail)) {
    throw new Error("Unauthorized");
  }
}

export function assertCanImpersonateTarget({
  operatorUserId,
  targetUserId,
  targetEmail,
}: {
  operatorUserId: string;
  targetUserId: string;
  targetEmail: string | null | undefined;
}) {
  if (targetUserId === operatorUserId) {
    throw new Error("Je kunt je eigen account niet impersoneren.");
  }

  if (isSystemAdmin(targetEmail)) {
    throw new Error("Je kunt geen systeembeheerder impersoneren.");
  }
}
