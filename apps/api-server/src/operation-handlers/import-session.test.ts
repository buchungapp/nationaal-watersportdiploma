import assert from "node:assert";
import crypto from "node:crypto";
import test from "node:test";
import * as api from "@nawadi/api";
import * as core from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { eq, sql } from "drizzle-orm";
import { withTestEnvironment } from "../testing/index.js";

const BUCHUNG_IMPORT_PRIVILEGE = "import-session:buchung";

type ImportSessionEntity = api.types.ImportSessionModel & {
  externalSessionKey: string;
  rowCount: number;
  rows: api.types.ImportSessionRowModel[];
  status: api.types.ImportSessionStatus;
  validationSummary: api.types.ImportSessionValidationSummaryModel;
};

function suffix() {
  return crypto.randomUUID().slice(0, 8);
}

function row(
  overrides: Partial<api.types.UpsertImportSessionRowModel> = {},
): api.types.UpsertImportSessionRowModel {
  return {
    rowIndex: 0,
    externalRowKey: "row-0",
    firstName: "Ada",
    lastName: "Lovelace",
    lastNamePrefix: null,
    dateOfBirth: "2010-05-12",
    birthCity: "Amsterdam",
    birthCountry: "nl",
    email: "ada@example.test",
    tags: ["optimist"],
    rawMetadata: { sourceLine: 1 },
    ...overrides,
  };
}

async function createUser() {
  const query = core.useQuery();
  const id = crypto.randomUUID();
  const email = `${id}@test.nawadi.local`;

  await query.execute(sql`
    insert into auth.users (id, email)
    values (${id}, ${email})
  `);
  await query.insert(s.user).values({
    authUserId: id,
    email,
    displayName: "Import API fixture user",
  });

  return { id };
}

async function grantBuchungPrivilege(apiKeyId: string) {
  const query = core.useQuery();

  await query
    .insert(s.privilege)
    .values({
      handle: BUCHUNG_IMPORT_PRIVILEGE,
      title: "Buchung import",
    })
    .onConflictDoNothing();

  const [privilege] = await query
    .select({ id: s.privilege.id })
    .from(s.privilege)
    .where(eq(s.privilege.handle, BUCHUNG_IMPORT_PRIVILEGE));
  assert(privilege);

  await query
    .insert(s.tokenPrivilege)
    .values({
      tokenId: apiKeyId,
      privilegeId: privilege.id,
    })
    .onConflictDoNothing();
}

async function createFixture(input: {
  prefix: string;
  grantPrivilege?: boolean;
}) {
  const user = await createUser();
  const locationHandle = `${input.prefix}-location-${suffix()}`;
  const cohortHandle = `${input.prefix}-cohort-${suffix()}`;
  const location = await core.Location.create({
    handle: locationHandle,
    name: `${input.prefix} Location`,
  });
  const cohort = await core.Cohort.create({
    handle: cohortHandle,
    label: `${input.prefix} Cohort`,
    locationId: location.id,
    accessStartTime: new Date(Date.now() - 86_400_000).toISOString(),
    accessEndTime: new Date(Date.now() + 86_400_000).toISOString(),
  });
  const person = await core.User.Person.getOrCreate({
    firstName: "Buchung",
    lastName: "Operator",
    userId: user.id,
  });
  await core.User.Person.linkToLocation({
    personId: person.id,
    locationId: location.id,
  });
  await core.User.Actor.upsert({
    personId: person.id,
    locationId: location.id,
    type: "location_admin",
  });

  const apiKey = await core.ApiKey.createForUser({
    name: `${input.prefix} key`,
    userId: user.id,
  });
  if (input.grantPrivilege) {
    await grantBuchungPrivilege(apiKey.id);
  }

  return {
    user,
    location: { ...location, handle: locationHandle },
    cohort: { ...cohort, handle: cohortHandle },
    person,
    apiKey,
  };
}

function upsertBody(
  rows: api.types.UpsertImportSessionRowModel[] = [row()],
  vendor = "buchung",
): api.types.UpsertImportSessionModel {
  return {
    source: { vendor },
    rows,
  };
}

test("import-session handlers reject API keys without Buchung import privilege", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-no-privilege",
      grantPrivilege: false,
    });

    const list = await api.client.listLocationCohortImportSessions(
      {
        contentType: null,
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
        },
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(list.status, 403);

    const upsert = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-1",
        },
        entity: () => upsertBody(),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(upsert.status, 403);

    const retrieve = await api.client.retrieveLocationImportSession(
      {
        contentType: null,
        parameters: {
          locationKey: fixture.location.handle,
          externalSessionKey: "session-1",
        },
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(retrieve.status, 403);
  }));

test("import-session handlers scope Buchung privilege to the requested location", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const allowed = await createFixture({
      prefix: "import-location-allowed",
      grantPrivilege: true,
    });
    const other = await createFixture({
      prefix: "import-location-other",
      grantPrivilege: false,
    });

    const response = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: other.location.handle,
          cohortKey: other.cohort.handle,
          externalSessionKey: "session-1",
        },
        entity: () => upsertBody(),
      },
      { apiKey: allowed.apiKey.token },
      { baseUrl },
    );

    assert.equal(response.status, 403);
  }));

test("import-session upsert accepts zero-row snapshots and can list/retrieve them", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-zero",
      grantPrivilege: true,
    });

    const upsert = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-zero",
        },
        entity: () => upsertBody([]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(upsert.status, 201);

    const upsertEntity = (await upsert.entity()) as ImportSessionEntity;
    assert.equal(upsertEntity.status, "received");
    assert.equal(upsertEntity.rowCount, 0);
    assert.deepEqual(upsertEntity.rows, []);
    assert.deepEqual(upsertEntity.validationSummary, {
      validRowCount: 0,
      warningRowCount: 0,
      invalidRowCount: 0,
    });

    const list = await api.client.listLocationCohortImportSessions(
      {
        contentType: null,
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
        },
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(list.status, 200);
    assert.equal((await list.entity()).length, 1);

    const retrieve = await api.client.retrieveLocationImportSession(
      {
        contentType: null,
        parameters: {
          locationKey: fixture.location.handle,
          externalSessionKey: "session-zero",
        },
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(retrieve.status, 200);
    assert.equal(
      ((await retrieve.entity()) as ImportSessionEntity).externalSessionKey,
      "session-zero",
    );
  }));

test("import-session upsert accepts optional null row fields as row validation", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-null-row",
      grantPrivilege: true,
    });

    const response = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-invalid-row",
        },
        entity: () =>
          upsertBody([
            row({
              firstName: null,
              lastName: null,
              dateOfBirth: null,
              birthCity: null,
              birthCountry: null,
              email: null,
            }),
          ]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );

    assert.equal(response.status, 201);
    const entity = (await response.entity()) as ImportSessionEntity;
    assert.equal(entity.validationSummary.invalidRowCount, 1);
    assert.equal(entity.rows[0]?.firstName, null);
    assert.equal(entity.rows[0]?.lastName, null);
    assert.equal(entity.rows[0]?.validation.status, "invalid");
    assert.deepEqual(
      entity.rows[0]?.validation.messages.map(
        (message: api.types.ImportSessionRowValidationMessageModel) => [
          message.code,
          message.field,
          message.severity,
        ],
      ),
      [
        ["missing_required_for_materialization", "birthCity", "error"],
        ["missing_required_for_materialization", "dateOfBirth", "error"],
        ["missing_required_for_materialization", "firstName", "error"],
        ["missing_required_for_materialization", "lastName", "error"],
      ],
    );
  }));

test("import-session upsert replaces the same key while received/reviewing", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-replace",
      grantPrivilege: true,
    });
    const query = core.useQuery();

    const first = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-replace",
        },
        entity: () => upsertBody([row()]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(first.status, 201);

    const [session] = await core.ImportSession.list({
      locationId: fixture.location.id,
      targetCohortId: fixture.cohort.id,
      sourceSystem: "buchung",
    });
    assert(session);
    const preview = await core.ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: fixture.person.id,
      roles: ["student"],
    });

    const second = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-replace",
        },
        entity: () => upsertBody([row({ lastName: "Byron" })]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(second.status, 200);

    const secondEntity = (await second.entity()) as ImportSessionEntity;
    assert.equal(secondEntity.status, "received");
    assert.equal(secondEntity.rows[0]?.lastName, "Byron");

    const [storedSession] = await query
      .select()
      .from(s.importSession)
      .where(eq(s.importSession.id, session.id));
    assert.equal(storedSession?.revision, 2);

    const [storedPreview] = await query
      .select()
      .from(s.importSessionPreview)
      .where(eq(s.importSessionPreview.id, preview.importSessionPreviewId));
    assert.equal(storedPreview?.status, "invalidated");
  }));

test("import-session upsert creates a new generation after terminal session", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-terminal",
      grantPrivilege: true,
    });
    const query = core.useQuery();

    const first = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-terminal",
        },
        entity: () => upsertBody([row()]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(first.status, 201);

    const [session] = await core.ImportSession.list({
      locationId: fixture.location.id,
      targetCohortId: fixture.cohort.id,
      sourceSystem: "buchung",
    });
    assert(session);
    await query
      .update(s.importSession)
      .set({ status: "committed" })
      .where(eq(s.importSession.id, session.id));

    const second = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-terminal",
        },
        entity: () => upsertBody([row({ lastName: "Changed" })]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );

    assert.equal(second.status, 201);
    const secondEntity = (await second.entity()) as ImportSessionEntity;
    assert.equal(secondEntity.status, "received");
    assert.equal(secondEntity.rows[0]?.lastName, "Changed");

    const sessions = await core.ImportSession.list({
      locationId: fixture.location.id,
      targetCohortId: fixture.cohort.id,
      sourceSystem: "buchung",
    }).then((items) => items.toSorted((a, b) => a.generation - b.generation));
    assert.equal(sessions.length, 2);
    assert.equal(sessions[0]?.id, session.id);
    assert.equal(sessions[0]?.status, "committed");
    assert.equal(sessions[1]?.status, "open");
    assert.equal(sessions[1]?.generation, 2);

    const storedOldRows = await query
      .select()
      .from(s.importSessionRow)
      .where(eq(s.importSessionRow.importSessionId, session.id));
    assert.equal(storedOldRows[0]?.lastName, "Lovelace");
    assert.equal(storedOldRows[0]?.supersededAt, null);

    const retrieve = await api.client.retrieveLocationImportSession(
      {
        contentType: null,
        parameters: {
          locationKey: fixture.location.handle,
          externalSessionKey: "session-terminal",
        },
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(retrieve.status, 200);
    assert.equal(
      ((await retrieve.entity()) as ImportSessionEntity).rows[0]?.lastName,
      "Changed",
    );
  }));

test("import-session upsert keeps same key different cohort as conflict", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-cohort-conflict",
      grantPrivilege: true,
    });
    const otherCohortHandle = `import-cohort-conflict-other-${suffix()}`;
    await core.Cohort.create({
      handle: otherCohortHandle,
      label: "Import Cohort Conflict Other",
      locationId: fixture.location.id,
      accessStartTime: new Date(Date.now() - 86_400_000).toISOString(),
      accessEndTime: new Date(Date.now() + 86_400_000).toISOString(),
    });

    const first = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-conflict",
        },
        entity: () => upsertBody([row()]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );
    assert.equal(first.status, 201);

    const second = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: otherCohortHandle,
          externalSessionKey: "session-conflict",
        },
        entity: () => upsertBody([row({ lastName: "Changed" })]),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );

    assert.equal(second.status, 409);
  }));

test("import-session upsert rejects body source vendor spoofing", () =>
  withTestEnvironment({ isolation: "transaction" }, async ({ baseUrl }) => {
    const fixture = await createFixture({
      prefix: "import-vendor-spoof",
      grantPrivilege: true,
    });

    const response = await api.client.upsertLocationCohortImportSession(
      {
        contentType: "application/json",
        parameters: {
          locationKey: fixture.location.handle,
          cohortKey: fixture.cohort.handle,
          externalSessionKey: "session-spoof",
        },
        entity: () => upsertBody([row()], "not-buchung"),
      },
      { apiKey: fixture.apiKey.token },
      { baseUrl },
    );

    assert.equal(response.status, 400);

    const sessions = await core.ImportSession.list({
      locationId: fixture.location.id,
      targetCohortId: fixture.cohort.id,
      sourceSystem: "buchung",
    });
    assert.equal(sessions.length, 0);
  }));
