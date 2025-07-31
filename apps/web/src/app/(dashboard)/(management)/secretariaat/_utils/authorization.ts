import { getUserOrThrow, isSecretariaat } from "~/lib/nwd";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import {
  SecretariaatAuthorizationError,
  SystemAdminAuthorizationError,
} from "./authorization-errors";

export async function secretariaatAuthorization(): Promise<void> {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email) && !(await isSecretariaat(user.authUserId))) {
    throw new SecretariaatAuthorizationError("You are not authorized");
  }
}

export async function systemAdminAuthorization(): Promise<void> {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    if (await isSecretariaat(user.authUserId)) {
      // This will still show the sidebar
      throw new SecretariaatAuthorizationError("You are not authorized");
    }

    throw new SystemAdminAuthorizationError("You are not authorized");
  }
}
