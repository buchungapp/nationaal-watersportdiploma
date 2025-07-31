import { notFound } from "next/navigation";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  secretariaatAuthorization,
  systemAdminAuthorization,
} from "../_utils/authorization";
import {
  SecretariaatAuthorizationError,
  SystemAdminAuthorizationError,
} from "../_utils/authorization-errors";

export function Unauthorized() {
  return (
    <>
      <Heading>Geen toegang!</Heading>
      <Text>Je hebt geen toegang tot deze pagina.</Text>
    </>
  );
}

export function withSecretariaatAuthorization<P extends object>(
  Component: React.ComponentType<P>,
  type: "notFound" | "unauthorized" = "unauthorized",
) {
  const WithSecretariaatAuthorization = async (props: P) => {
    try {
      await secretariaatAuthorization();
    } catch (error) {
      if (error instanceof SecretariaatAuthorizationError) {
        if (type === "notFound") {
          notFound();
        } else {
          return <Unauthorized />;
        }
      }

      throw error;
    }

    return <Component {...props} />;
  };

  WithSecretariaatAuthorization.displayName = `withSecretariaatAuthorization(${Component.displayName || Component.name})`;
  return WithSecretariaatAuthorization;
}

export function withSystemAdminAuthorization<P extends object>(
  Component: React.ComponentType<P>,
  type: "notFound" | "unauthorized" = "unauthorized",
) {
  const WithSystemAdminAuthorization = async (props: P) => {
    try {
      await systemAdminAuthorization();
    } catch (error) {
      if (error instanceof SystemAdminAuthorizationError) {
        if (type === "notFound") {
          notFound();
        } else {
          return <Unauthorized />;
        }
      }

      throw error;
    }

    return <Component {...props} />;
  };

  WithSystemAdminAuthorization.displayName = `withSystemAdminAuthorization(${Component.displayName || Component.name})`;
  return WithSystemAdminAuthorization;
}
