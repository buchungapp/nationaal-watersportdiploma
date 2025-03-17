import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const logbookParams = {
  "logbook-page": parseAsInteger.withDefault(1),
  "logbook-limit": parseAsInteger.withDefault(25),
};

export const certificateParams = {
  "edit-certificate": parseAsString,
  "media-viewer": parseAsString,
};

export const pageParamsCache = createSearchParamsCache({
  ...logbookParams,
  ...certificateParams,
});
