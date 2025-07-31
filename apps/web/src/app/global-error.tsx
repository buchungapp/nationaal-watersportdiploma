"use client"; // Error components must be Client Components
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    // TODO: Log the error to an error reporting service
    console.error(error);

    if (
      error.name === "AuthorizationError" ||
      error.name === "SecretariaatAuthorizationError" ||
      error.name === "SystemAdminAuthorizationError"
    ) {
      router.replace("/unauthorized");
      return;
    }

    return router.push(`/error?errorMessage=${error.message}`);
  }, [error, router]);
}
