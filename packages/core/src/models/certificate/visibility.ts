import dayjs from "dayjs";

export const CERTIFICATE_VISIBILITY_DELAY_HOURS = 72;

export function assertVisibleFromWithinAllowedDelay({
  issuedAt,
  visibleFrom,
}: {
  issuedAt: string;
  visibleFrom: string;
}) {
  const latestVisibleFrom = dayjs(issuedAt).add(
    CERTIFICATE_VISIBILITY_DELAY_HOURS,
    "hour",
  );

  if (dayjs(visibleFrom).isAfter(latestVisibleFrom)) {
    throw new Error(
      `Certificate visibility can be delayed by at most ${CERTIFICATE_VISIBILITY_DELAY_HOURS} hours after issuance`,
    );
  }
}

export function assertCertificateVisibilityStillMutable({
  issuedAt,
}: {
  issuedAt: string;
}) {
  const mutableUntil = dayjs(issuedAt).add(
    CERTIFICATE_VISIBILITY_DELAY_HOURS,
    "hour",
  );

  if (dayjs().isAfter(mutableUntil)) {
    throw new Error(
      `Certificate visibility can only be changed within ${CERTIFICATE_VISIBILITY_DELAY_HOURS} hours after issuance`,
    );
  }
}
