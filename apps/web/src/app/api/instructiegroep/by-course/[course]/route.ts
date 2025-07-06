import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInstructiegroepByCourseId } from "~/lib/nwd";

const paramsSchema = z.object({
  course: z.string().uuid(),
});

const querySchema = z.object({
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ course: string }> },
) {
  try {
    const params = await context.params;
    const { course } = paramsSchema.parse(params);

    const { searchParams } = new URL(request.url);
    const { richting } = querySchema.parse({
      richting: searchParams.get("richting") || "instructeur",
    });

    const instructiegroep = await getInstructiegroepByCourseId(
      course,
      richting,
    );

    return NextResponse.json(instructiegroep);
  } catch (error) {
    console.error("Error fetching instructiegroep:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructiegroep" },
      { status: 500 },
    );
  }
}
