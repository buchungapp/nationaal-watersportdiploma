import { type NextRequest, NextResponse } from "next/server";
import { listBeoordelaarsForLocation } from "~/lib/nwd";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ location: string }> },
) {
  const locationId = (await context.params).location;

  try {
    const response = await listBeoordelaarsForLocation(locationId);
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch beoordelaars" },
      { status: 500 },
    );
  }
}
