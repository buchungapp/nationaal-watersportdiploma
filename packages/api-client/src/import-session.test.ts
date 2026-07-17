import assert from "node:assert/strict";
import test from "node:test";
import {
  createNawadiApiClient,
  type UpsertLocationCohortData,
  type UpsertLocationCohortImportSessionData,
} from "./index.ts";

test("sends API key and request id headers for cohort upserts", async () => {
  const requests: Array<{
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];

  const api = createNawadiApiClient({
    baseUrl: "https://api.example.test",
    apiKey: "nwd_test_secret",
    requestId: "req_123",
    fetch: async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const bodyText = await request.text();

      requests.push({
        url: request.url,
        method: request.method,
        headers,
        body: bodyText ? JSON.parse(bodyText) : null,
      });

      return new Response(
        JSON.stringify({
          locationKey: "locatie-a",
          cohortKey: "buchung-event-123",
          label: "Jeugd zeilen week 1",
          accessStartTime: "2026-07-02T10:00:00.000Z",
          accessEndTime: "2026-07-09T10:00:00.000Z",
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    },
  });

  const request: UpsertLocationCohortData = {
    path: {
      "location-key": "locatie-a",
      "cohort-key": "buchung-event-123",
    },
    url: "/api/location/{location-key}/cohort/{cohort-key}",
    body: {
      source: {
        vendor: "buchung",
        exportedAt: "2026-07-02T10:00:00.000Z",
      },
      label: "Jeugd zeilen week 1",
      accessStartTime: "2026-07-02T10:00:00.000Z",
      accessEndTime: "2026-07-09T10:00:00.000Z",
    },
  };

  const response = await api.cohort.upsertLocationCohort(request);

  assert.ok(response.response);
  assert.equal(response.response.status, 201);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], {
    url: "https://api.example.test/api/location/locatie-a/cohort/buchung-event-123",
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-api-key": "nwd_test_secret",
      "x-request-id": "req_123",
    },
    body: {
      source: {
        vendor: "buchung",
        exportedAt: "2026-07-02T10:00:00.000Z",
      },
      label: "Jeugd zeilen week 1",
      accessStartTime: "2026-07-02T10:00:00.000Z",
      accessEndTime: "2026-07-09T10:00:00.000Z",
    },
  });
});

test("sends API key and request id headers for import-session upserts", async () => {
  const requests: Array<{
    url: string;
    method?: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];

  const api = createNawadiApiClient({
    baseUrl: "https://api.example.test",
    apiKey: "nwd_test_secret",
    requestId: "req_123",
    fetch: async (input, init) => {
      const request =
        input instanceof Request ? input : new Request(input, init);
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      const bodyText = await request.text();

      requests.push({
        url: request.url,
        method: request.method,
        headers,
        body: bodyText ? JSON.parse(bodyText) : null,
      });

      return new Response(
        JSON.stringify({
          externalSessionKey: "event-123",
          locationKey: "locatie-a",
          cohortKey: "cohort-a",
          status: "received",
          rowCount: 0,
          validationSummary: {
            validRowCount: 0,
            invalidRowCount: 0,
            warningRowCount: 0,
          },
          receivedAt: "2026-07-02T10:00:00.000Z",
          updatedAt: "2026-07-02T10:00:00.000Z",
          source: { vendor: "buchung" },
          rows: [],
        }),
        {
          status: 201,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    },
  });

  const request: UpsertLocationCohortImportSessionData = {
    path: {
      "location-key": "locatie-a",
      "cohort-key": "cohort-a",
      "external-session-key": "event-123",
    },
    url: "/api/location/{location-key}/cohort/{cohort-key}/import-session/{external-session-key}",
    body: {
      source: {
        vendor: "buchung",
        exportedAt: "2026-07-02T10:00:00.000Z",
      },
      rows: [
        {
          externalPersonKey: "buchung:organization-person:person-1",
          externalRowKey: "registration-group-1",
          rowIndex: 0,
        },
      ],
    },
  };

  const response =
    await api.importSession.upsertLocationCohortImportSession(request);

  assert.ok(response.response);
  assert.equal(response.response.status, 201);
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0], {
    url: "https://api.example.test/api/location/locatie-a/cohort/cohort-a/import-session/event-123",
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-api-key": "nwd_test_secret",
      "x-request-id": "req_123",
    },
    body: {
      source: {
        vendor: "buchung",
        exportedAt: "2026-07-02T10:00:00.000Z",
      },
      rows: [
        {
          externalPersonKey: "buchung:organization-person:person-1",
          externalRowKey: "registration-group-1",
          rowIndex: 0,
        },
      ],
    },
  });
});
