import { createClient } from "./generated/client/index.ts";
import { Cohort, ImportSession } from "./generated/index.ts";

export * from "./generated/index.ts";

export const DEFAULT_NAWADI_API_BASE_URL =
  "https://api.nationaalwatersportdiploma.nl";

export type NawadiApiClientConfig = {
  baseUrl?: string;
  apiKey?: string;
  requestId?: string;
  fetch?: typeof fetch;
};

export type NawadiApiClient = {
  cohort: {
    upsertLocationCohort: typeof Cohort.upsertLocationCohort;
  };
  importSession: {
    listLocationCohortImportSessions: typeof ImportSession.listLocationCohortImportSessions;
    retrieveLocationImportSession: typeof ImportSession.retrieveLocationImportSession;
    upsertLocationCohortImportSession: typeof ImportSession.upsertLocationCohortImportSession;
  };
};

export function createNawadiApiClient(
  config: NawadiApiClientConfig = {},
): NawadiApiClient {
  const generatedClient = createClient({
    baseUrl: config.baseUrl ?? DEFAULT_NAWADI_API_BASE_URL,
    fetch: config.fetch,
    headers: buildHeaders(config),
  });

  return {
    cohort: {
      upsertLocationCohort: (options) =>
        Cohort.upsertLocationCohort({
          ...options,
          client: generatedClient,
        }),
    },
    importSession: {
      listLocationCohortImportSessions: (options) =>
        ImportSession.listLocationCohortImportSessions({
          ...options,
          client: generatedClient,
        }),
      retrieveLocationImportSession: (options) =>
        ImportSession.retrieveLocationImportSession({
          ...options,
          client: generatedClient,
        }),
      upsertLocationCohortImportSession: (options) =>
        ImportSession.upsertLocationCohortImportSession({
          ...options,
          client: generatedClient,
        }),
    },
  };
}

function buildHeaders(
  config: Pick<NawadiApiClientConfig, "apiKey" | "requestId">,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.apiKey) {
    headers["x-api-key"] = config.apiKey;
  }

  if (config.requestId) {
    headers["X-Request-Id"] = config.requestId;
  }

  return headers;
}
