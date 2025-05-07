import { type NextRequest, NextResponse } from "next/server";
import { listPersonsForLocationWithPagination } from "~/lib/nwd";
import { parsePersonListSearchParams } from "./search-params";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ location: string }> },
) {
  const { searchParams } = new URL(request.url);
  const { query, limit, offset, actorType } =
    parsePersonListSearchParams(searchParams);

  const locationId = (await context.params).location;

  const persons = await listPersonsForLocationWithPagination(locationId, {
    filter: {
      q: query ?? undefined,
      actorType: actorType.length > 0 ? actorType : undefined,
    },
    limit,
    offset: offset ?? undefined,
  });

  return NextResponse.json(persons);
}
