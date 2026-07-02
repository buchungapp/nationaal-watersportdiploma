import assert from "node:assert";
import crypto from "node:crypto";
import test from "node:test";
import { schema as s } from "@nawadi/db";
import { eq, sql } from "drizzle-orm";
import { useQuery, withTestTransaction } from "../../contexts/index.js";
import { Location, User } from "../index.js";
import {
  byToken,
  createForUser,
  userBoundApiKeyHasPrivilegeForLocation,
} from "./api-key.js";

async function createUserFixture() {
  const query = useQuery();
  const id = crypto.randomUUID();
  const email = `${id}@test.nawadi.local`;

  await query.execute(sql`
    insert into auth.users (id, email)
    values (${id}, ${email})
  `);
  await query.insert(s.user).values({
    authUserId: id,
    email,
    displayName: "API key fixture user",
  });

  return { id };
}

async function grantTokenPrivilege(input: {
  apiKeyId: string;
  privilegeHandle: string;
}) {
  const query = useQuery();
  const privilege = await query
    .insert(s.privilege)
    .values({
      handle: input.privilegeHandle,
      title: input.privilegeHandle,
    })
    .returning({ id: s.privilege.id })
    .then(([row]) => {
      assert(row);
      return row;
    });

  await query.insert(s.tokenPrivilege).values({
    tokenId: input.apiKeyId,
    privilegeId: privilege.id,
  });
}

test("apiKey.byToken accepts unexpired keys and rejects expired keys", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const user = await createUserFixture();

    const futureKey = await createForUser({
      name: "future key",
      userId: user.id,
    });
    await query
      .update(s.token)
      .set({ expires: new Date(Date.now() + 60_000).toISOString() })
      .where(eq(s.token.id, futureKey.id));

    const expiredKey = await createForUser({
      name: "expired key",
      userId: user.id,
    });
    await query
      .update(s.token)
      .set({ expires: new Date(Date.now() - 60_000).toISOString() })
      .where(eq(s.token.id, expiredKey.id));

    assert.equal((await byToken(futureKey.token))?.id, futureKey.id);
    assert.equal(await byToken(expiredKey.token), undefined);
  }));

test("user-bound api keys require token privilege and an active location-admin binding", () =>
  withTestTransaction(async () => {
    const user = await createUserFixture();
    const location = await Location.create({
      handle: `api-authz-${crypto.randomUUID().slice(0, 8)}`,
      name: "API authz location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "API",
      lastName: "Admin",
      userId: user.id,
    });
    await User.Person.linkToLocation({ personId, locationId: location.id });
    await User.Actor.upsert({
      personId,
      locationId: location.id,
      type: "location_admin",
    });

    const apiKey = await createForUser({
      name: "authorized key",
      userId: user.id,
    });
    const privilegeHandle = `vendor-import-${crypto.randomUUID()}`;
    await grantTokenPrivilege({
      apiKeyId: apiKey.id,
      privilegeHandle,
    });

    assert.equal(
      await userBoundApiKeyHasPrivilegeForLocation({
        apiKeyId: apiKey.id,
        privilegeHandle,
        locationId: location.id,
      }),
      true,
    );

    assert.equal(
      await userBoundApiKeyHasPrivilegeForLocation({
        apiKeyId: apiKey.id,
        privilegeHandle: "missing-privilege",
        locationId: location.id,
      }),
      false,
    );
  }));

test("user-bound api key location bridge rejects non-admin and inactive bindings by default", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const user = await createUserFixture();
    const location = await Location.create({
      handle: `api-authz-reject-${crypto.randomUUID().slice(0, 8)}`,
      name: "API authz reject location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "API",
      lastName: "Instructor",
      userId: user.id,
    });
    await User.Person.linkToLocation({ personId, locationId: location.id });
    await User.Actor.upsert({
      personId,
      locationId: location.id,
      type: "instructor",
    });

    const apiKey = await createForUser({
      name: "instructor key",
      userId: user.id,
    });
    const privilegeHandle = `vendor-import-${crypto.randomUUID()}`;
    await grantTokenPrivilege({
      apiKeyId: apiKey.id,
      privilegeHandle,
    });

    assert.equal(
      await userBoundApiKeyHasPrivilegeForLocation({
        apiKeyId: apiKey.id,
        privilegeHandle,
        locationId: location.id,
      }),
      false,
    );

    await User.Actor.upsert({
      personId,
      locationId: location.id,
      type: "location_admin",
    });
    await query
      .update(s.personLocationLink)
      .set({ status: "removed" })
      .where(eq(s.personLocationLink.personId, personId));

    assert.equal(
      await userBoundApiKeyHasPrivilegeForLocation({
        apiKeyId: apiKey.id,
        privilegeHandle,
        locationId: location.id,
      }),
      false,
    );
  }));
