import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

export const parseCertificateSearchParams = createLoader({
  "edit-certificate": parseAsString,
  "media-viewer": parseAsString,
});

export const parseLogbookSearchParams = createLoader({
  "logbook-page": parseAsInteger.withDefault(1),
  "logbook-limit": parseAsInteger.withDefault(25),
});
