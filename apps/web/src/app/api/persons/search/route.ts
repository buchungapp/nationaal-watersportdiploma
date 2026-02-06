import { User } from "@nawadi/core";
import { type NextRequest, NextResponse } from "next/server";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import { parsePersonSearchParams } from "./_search-params";

export async function GET(request: NextRequest) {
  const user = await getUserOrThrow();
  if (!isSystemAdmin(user.email)) {
    return NextResponse.json({ error: "Geen toegang" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const { query, limit, excludePersonId } =
    parsePersonSearchParams(searchParams);

  if (!query) {
    return NextResponse.json([]);
  }

  const persons = await User.Person.searchForAutocomplete({
    q: query,
    limit,
    excludePersonId: excludePersonId ?? undefined,
  });

  return NextResponse.json(persons);
}
