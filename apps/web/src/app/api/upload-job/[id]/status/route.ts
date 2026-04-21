import { Leercoach } from "@nawadi/core";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

// Pollable status endpoint for upload jobs. The PortfolioUploadDialog
// hits this every ~2s after submitting an upload, stops once the
// status resolves to 'ready' or 'failed'.
//
// Shape kept narrow on purpose — we only expose what the client
// actually needs to render state. Internal fields like
// workflow_run_id stay on the job row for ops debugging.

type StatusBody =
  | {
      status: "pending" | "processing";
    }
  | {
      status: "ready";
      sourceId: string;
    }
  | {
      status: "failed";
      errorMessage: string;
    };

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: jobId } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const job = await Leercoach.UploadJob.getById({
    jobId,
    userId: user.id,
  });
  if (!job) {
    return NextResponse.json(
      { error: "Upload-job niet gevonden." },
      { status: 404 },
    );
  }

  let body: StatusBody;
  switch (job.status) {
    case "pending":
    case "processing":
      body = { status: job.status };
      break;
    case "ready":
      // sourceId is set by the final workflow step in lockstep with
      // status='ready', so this should always be present — but fall
      // back safely if something raced.
      body = {
        status: "ready",
        sourceId: job.sourceId ?? "",
      };
      break;
    case "failed":
      body = {
        status: "failed",
        errorMessage:
          job.errorMessage ??
          "Verwerken mislukt. Probeer opnieuw of neem contact op met ondersteuning.",
      };
      break;
  }

  return NextResponse.json(body);
}
