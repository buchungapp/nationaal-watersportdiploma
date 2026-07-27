import assert from "node:assert";
import test from "node:test";
import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, asc, eq, sql } from "drizzle-orm";
import { useQuery, withTestTransaction } from "../../contexts/index.ts";
import { CoreError, CoreErrorType } from "../../utils/index.ts";
import { Cohort, ImportSession, Location, User } from "../index.ts";

async function createFixture(prefix: string) {
  const location = await Location.create({
    handle: `${prefix}-location`,
    name: `${prefix} Location`,
  });

  const cohort = await Cohort.create({
    handle: `${prefix}-cohort`,
    label: `${prefix} Cohort`,
    locationId: location.id,
    accessStartTime: dayjs().subtract(1, "day").toISOString(),
    accessEndTime: dayjs().add(1, "day").toISOString(),
  });

  const operator = await User.Person.getOrCreate({
    firstName: `${prefix} Operator`,
    lastName: "Import",
  });

  return { location, cohort, operator };
}

function validRow(
  overrides: Partial<
    Parameters<typeof ImportSession.upsertFullSnapshot>[0]["rows"][number]
  > = {},
) {
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
    rawPayload: { source: "test" },
    ...overrides,
  };
}

test("importSession.upsertFullSnapshot is idempotent for identical full snapshots", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort } = await createFixture("import-idempotent");

    const first = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });

    const second = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });

    assert.equal(second.id, first.id);
    assert.equal(second.revision, first.revision);
    assert.equal(second.changed, false);
    assert.equal(second.insertedRows, 0);

    const rows = await query
      .select()
      .from(s.importSessionRow)
      .where(eq(s.importSessionRow.importSessionId, first.id));
    assert.equal(rows.length, 1);
  }));

test("importSession accepts invalid materialization rows as row-level validation messages", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort } = await createFixture("import-invalid-row");

    const beforePeople = await query
      .select({ count: sql<number>`count(*)::int` })
      .from(s.person)
      .then((rows) => rows[0]?.count ?? 0);
    const beforeAllocations = await query
      .select({ count: sql<number>`count(*)::int` })
      .from(s.cohortAllocation)
      .then((rows) => rows[0]?.count ?? 0);

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [
        validRow({
          firstName: null,
          lastName: " ",
          dateOfBirth: null,
          birthCity: null,
          birthCountry: null,
          email: "not-an-email",
        }),
      ],
    });

    const [row] = await query
      .select()
      .from(s.importSessionRow)
      .where(eq(s.importSessionRow.importSessionId, session.id));

    assert.equal(row?.status, "invalid");
    assert.equal(row?.firstName, "");
    assert.equal(row?.lastName, "");
    assert.equal(row?.dateOfBirth, null);
    assert.equal(row?.birthCity, null);
    assert.equal(row?.birthCountry, null);
    assert.deepEqual(
      (
        row?.validationErrors as {
          code: string;
          field?: string;
          severity: string;
        }[]
      )
        .map((message) => [message.code, message.field, message.severity])
        .toSorted(),
      [
        ["invalid_email", "email", "warning"],
        ["missing_required_for_materialization", "birthCity", "error"],
        ["missing_required_for_materialization", "dateOfBirth", "error"],
        ["missing_required_for_materialization", "firstName", "error"],
        ["missing_required_for_materialization", "lastName", "error"],
      ],
    );

    const afterPeople = await query
      .select({ count: sql<number>`count(*)::int` })
      .from(s.person)
      .then((rows) => rows[0]?.count ?? 0);
    const afterAllocations = await query
      .select({ count: sql<number>`count(*)::int` })
      .from(s.cohortAllocation)
      .then((rows) => rows[0]?.count ?? 0);

    assert.equal(afterPeople, beforePeople);
    assert.equal(afterAllocations, beforeAllocations);
  }));

test("importSession preserves row ordering and external row keys", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort } = await createFixture("import-row-order");

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [
        validRow({ rowIndex: 7, externalRowKey: "external-b" }),
        validRow({ rowIndex: 2, externalRowKey: "external-a" }),
      ],
    });

    const rows = await query
      .select({
        rowIndex: s.importSessionRow.rowIndex,
        externalRowKey: s.importSessionRow.externalRowKey,
      })
      .from(s.importSessionRow)
      .where(eq(s.importSessionRow.importSessionId, session.id))
      .orderBy(asc(s.importSessionRow.rowIndex));

    assert.deepEqual(rows, [
      { rowIndex: 2, externalRowKey: "external-a" },
      { rowIndex: 7, externalRowKey: "external-b" },
    ]);
  }));

test("importSession preserves optional external person keys", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort } = await createFixture("import-person-key");

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [
        validRow({
          externalPersonKey: "buchung:organization-person:shared",
        }),
        validRow({
          externalPersonKey: null,
          externalRowKey: "row-1",
          rowIndex: 1,
        }),
      ],
    });

    const rows = await query
      .select({
        rowIndex: s.importSessionRow.rowIndex,
        externalPersonKey: s.importSessionRow.externalPersonKey,
      })
      .from(s.importSessionRow)
      .where(eq(s.importSessionRow.importSessionId, session.id))
      .orderBy(asc(s.importSessionRow.rowIndex));

    assert.deepEqual(rows, [
      {
        externalPersonKey: "buchung:organization-person:shared",
        rowIndex: 0,
      },
      { externalPersonKey: null, rowIndex: 1 },
    ]);
  }));

test("importSession list scopes by location and cohort", () =>
  withTestTransaction(async () => {
    const one = await createFixture("import-scope-one");
    const two = await createFixture("import-scope-two");

    await ImportSession.upsertFullSnapshot({
      locationId: one.location.id,
      targetCohortId: one.cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "same-external-key",
      rows: [validRow()],
    });
    await ImportSession.upsertFullSnapshot({
      locationId: two.location.id,
      targetCohortId: two.cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "same-external-key",
      rows: [validRow()],
    });

    const scoped = await ImportSession.list({
      locationId: one.location.id,
      targetCohortId: one.cohort.id,
      sourceSystem: "fable",
    });

    assert.equal(scoped.length, 1);
    assert.equal(scoped[0]?.locationId, one.location.id);
    assert.equal(scoped[0]?.targetCohortId, one.cohort.id);
  }));

test("importSession rejects reusing an external session key for another cohort in the same location", () =>
  withTestTransaction(async () => {
    const { location, cohort } = await createFixture("import-key-conflict");
    const otherCohort = await Cohort.create({
      handle: "import-key-conflict-other-cohort",
      label: "Import Key Conflict Other Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(1, "day").toISOString(),
    });

    await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "same-external-key",
      rows: [validRow()],
    });

    await assert.rejects(
      () =>
        ImportSession.upsertFullSnapshot({
          locationId: location.id,
          targetCohortId: otherCohort.id,
          sourceSystem: "fable",
          externalSessionKey: "same-external-key",
          rows: [validRow()],
        }),
      (error) => {
        assert.ok(error instanceof CoreError);
        assert.equal(error.type, CoreErrorType.UniqueKey);
        assert.match(error.message, /different cohort in this location/);
        return true;
      },
    );
  }));

test("importSession changed full snapshot invalidates active materialized preview", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort, operator } = await createFixture(
      "import-preview-invalidates",
    );

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });

    const preview = await ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });

    const changed = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow({ lastName: "Byron" })],
    });

    assert.equal(changed.id, session.id);
    assert.equal(changed.revision, 2);
    assert.equal(changed.status, "open");

    const [previewLink] = await query
      .select()
      .from(s.importSessionPreview)
      .where(eq(s.importSessionPreview.id, preview.importSessionPreviewId));
    assert.equal(previewLink?.status, "invalidated");

    const [bulkPreview] = await query
      .select()
      .from(s.bulkImportPreview)
      .where(eq(s.bulkImportPreview.token, preview.previewToken));
    assert.equal(bulkPreview?.status, "invalidated_max");
  }));

test("importSession materialize reuses an active preview for reviewing sessions", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort, operator } = await createFixture(
      "import-reopen-review",
    );

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });

    const firstPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });
    const reopenedPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });

    assert.equal(reopenedPreview.previewToken, firstPreview.previewToken);
    assert.equal(
      reopenedPreview.importSessionPreviewId,
      firstPreview.importSessionPreviewId,
    );

    const activePreviews = await query
      .select()
      .from(s.importSessionPreview)
      .where(
        and(
          eq(s.importSessionPreview.importSessionId, session.id),
          eq(s.importSessionPreview.status, "active"),
        ),
      );
    assert.equal(activePreviews.length, 1);
  }));

test("importSession supports zero-row snapshots and supersedes older reviewing sessions", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort, operator } = await createFixture(
      "import-zero-supersede",
    );

    const oldSession = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-old",
      rows: [validRow()],
    });
    const oldPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: oldSession.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });

    const newSession = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-new",
      rows: [],
    });

    assert.equal(newSession.rowCount, 0);

    const [storedOld] = await query
      .select()
      .from(s.importSession)
      .where(eq(s.importSession.id, oldSession.id));
    assert.equal(storedOld?.status, "superseded");

    const [storedOldPreview] = await query
      .select()
      .from(s.importSessionPreview)
      .where(eq(s.importSessionPreview.id, oldPreview.importSessionPreviewId));
    assert.equal(storedOldPreview?.status, "superseded");
  }));

test("importSession creates a new generation after a committed or cancelled session key", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    for (const terminalStatus of ["committed", "cancelled"] as const) {
      const { location, cohort } = await createFixture(
        `import-${terminalStatus}`,
      );

      const session = await ImportSession.upsertFullSnapshot({
        locationId: location.id,
        targetCohortId: cohort.id,
        sourceSystem: "fable",
        externalSessionKey: "session-1",
        rows: [validRow()],
      });

      await query
        .update(s.importSession)
        .set({ status: terminalStatus })
        .where(eq(s.importSession.id, session.id));

      const next = await ImportSession.upsertFullSnapshot({
        locationId: location.id,
        targetCohortId: cohort.id,
        sourceSystem: "fable",
        externalSessionKey: "session-1",
        rows: [validRow({ lastName: "Changed" })],
      });

      assert.notEqual(next.id, session.id);
      assert.equal(next.generation, 2);
      assert.equal(next.revision, 1);
      assert.equal(next.status, "open");

      const storedSessions = await query
        .select()
        .from(s.importSession)
        .where(
          and(
            eq(s.importSession.locationId, location.id),
            eq(s.importSession.targetCohortId, cohort.id),
            eq(s.importSession.sourceSystem, "fable"),
            eq(s.importSession.externalSessionKey, "session-1"),
          ),
        )
        .orderBy(asc(s.importSession.generation));
      assert.equal(storedSessions.length, 2);
      assert.equal(storedSessions[0]?.id, session.id);
      assert.equal(storedSessions[0]?.status, terminalStatus);
      assert.equal(storedSessions[1]?.id, next.id);

      const oldRows = await query
        .select()
        .from(s.importSessionRow)
        .where(eq(s.importSessionRow.importSessionId, session.id));
      assert.equal(oldRows.length, 1);
      assert.equal(oldRows[0]?.lastName, "Lovelace");
      assert.equal(oldRows[0]?.supersededAt, null);
    }
  }));

async function commitImportPreview(input: {
  locationId: string;
  operatorId: string;
  previewToken: string;
  decisions: Parameters<typeof User.Person.commitBulkImport>[0]["decisions"];
}) {
  return User.Person.commitBulkImport({
    previewToken: input.previewToken,
    performedByPersonId: input.operatorId,
    decisions: input.decisions,
    createPerson: async (candidate) => {
      const person = await User.Person.getOrCreate({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        lastNamePrefix: candidate.lastNamePrefix,
        dateOfBirth: candidate.dateOfBirth,
        birthCity: candidate.birthCity,
        birthCountry: candidate.birthCountry,
      });
      await User.Person.createLocationLink({
        personId: person.id,
        locationId: input.locationId,
      });
      return { personId: person.id };
    },
  });
}

test("importSession commit records row provenance and commits session atomically", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const { location, cohort, operator } = await createFixture(
      "import-commit-provenance",
    );

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });
    const preview = await ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });

    const result = await commitImportPreview({
      locationId: location.id,
      operatorId: operator.id,
      previewToken: preview.previewToken,
      decisions: { "0": { kind: "create_new" } },
    });

    assert.equal((result as { kind: string }).kind, "committed");

    const [storedSession] = await query
      .select()
      .from(s.importSession)
      .where(eq(s.importSession.id, session.id));
    assert.equal(storedSession?.status, "committed");

    const [storedPreview] = await query
      .select()
      .from(s.importSessionPreview)
      .where(eq(s.importSessionPreview.importSessionId, session.id));
    assert.equal(storedPreview?.status, "committed");

    const rowCommits = await query
      .select()
      .from(s.importSessionRowCommit)
      .where(
        eq(
          s.importSessionRowCommit.bulkImportPreviewToken,
          preview.previewToken,
        ),
      );
    assert.equal(rowCommits.length, 1);
    assert.equal(rowCommits[0]?.decisionKind, "create_new");
    assert(rowCommits[0]?.personMergeAuditId);
    assert(rowCommits[0]?.targetPersonId);
  }));

test("importSession commit hard-fails when preview was replaced", () =>
  withTestTransaction(async () => {
    const { location, cohort, operator } = await createFixture(
      "import-stale-preview",
    );

    const session = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow()],
    });
    const preview = await ImportSession.materializeBulkImportPreview({
      importSessionId: session.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });

    await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow({ lastName: "Changed" })],
    });

    await assert.rejects(
      commitImportPreview({
        locationId: location.id,
        operatorId: operator.id,
        previewToken: preview.previewToken,
        decisions: { "0": { kind: "create_new" } },
      }),
      /verouderd/,
    );
  }));

test("importSession materialize carries unchanged committed rows and requires review for changed rows", () =>
  withTestTransaction(async () => {
    const { location, cohort, operator } = await createFixture("import-day-2");

    const first = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow({ externalRowKey: "stable-row" })],
    });
    const firstPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: first.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });
    await commitImportPreview({
      locationId: location.id,
      operatorId: operator.id,
      previewToken: firstPreview.previewToken,
      decisions: { "0": { kind: "create_new" } },
    });

    const unchanged = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [validRow({ externalRowKey: "stable-row" })],
    });
    const unchangedPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: unchanged.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });
    const unchangedMatch = (
      unchangedPreview.matches as {
        matchesByRow: {
          rowIndex: number;
          candidates: {
            personId: string;
            isAlreadyInTargetCohort: boolean;
            reasons: string[];
          }[];
        }[];
      }
    ).matchesByRow[0]?.candidates[0];
    assert.equal(unchangedMatch?.isAlreadyInTargetCohort, true);
    assert(
      unchangedMatch?.reasons.includes("import_session_unchanged_prior_commit"),
    );

    await commitImportPreview({
      locationId: location.id,
      operatorId: operator.id,
      previewToken: unchangedPreview.previewToken,
      decisions: { "0": { kind: "skip", reason: "cohort_conflict" } },
    });

    const committedRows = await useQuery()
      .select({
        targetPersonId: s.importSessionRowCommit.targetPersonId,
        decisionKind: s.importSessionRowCommit.decisionKind,
      })
      .from(s.importSessionRowCommit)
      .where(
        eq(
          s.importSessionRowCommit.bulkImportPreviewToken,
          unchangedPreview.previewToken,
        ),
      );
    assert.equal(committedRows.length, 1);
    assert.equal(committedRows[0]?.decisionKind, "skip");
    assert.equal(committedRows[0]?.targetPersonId, unchangedMatch?.personId);

    const changed = await ImportSession.upsertFullSnapshot({
      locationId: location.id,
      targetCohortId: cohort.id,
      sourceSystem: "fable",
      externalSessionKey: "session-1",
      rows: [
        validRow({ externalRowKey: "stable-row", birthCity: "Rotterdam" }),
      ],
    });
    const changedPreview = await ImportSession.materializeBulkImportPreview({
      importSessionId: changed.id,
      performedByPersonId: operator.id,
      roles: ["student"],
    });
    const changedMatch = (
      changedPreview.matches as {
        matchesByRow: {
          rowIndex: number;
          candidates: {
            isAlreadyInTargetCohort: boolean;
            reasons: string[];
          }[];
        }[];
      }
    ).matchesByRow[0]?.candidates[0];
    assert.equal(changedMatch?.isAlreadyInTargetCohort, false);
    assert(
      changedMatch?.reasons.includes(
        "import_session_changed_since_prior_commit",
      ),
    );
  }));
