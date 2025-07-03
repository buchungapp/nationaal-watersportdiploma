import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listKssKwalificatieprofielenWithOnderdelen } from "~/lib/nwd";

const paramsSchema = z.object({
  niveau: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ niveau: string }> },
) {
  try {
    const params = await context.params;
    const { niveau } = paramsSchema.parse(params);

    const kwalificatieprofielen =
      await listKssKwalificatieprofielenWithOnderdelen(niveau);

    return NextResponse.json({
      items: kwalificatieprofielen,
      total: kwalificatieprofielen.length,
    });
  } catch (error) {
    console.error("Error fetching kwalificatieprofielen:", error);
    return NextResponse.json(
      { error: "Failed to fetch kwalificatieprofielen" },
      { status: 500 },
    );
  }
}
