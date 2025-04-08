export async function POST(request: Request) {
  try {
    const report = await request.json();

    // Log the CSP violation report
    console.error("CSP Violation Report:", {
      "document-uri": report.body?.documentURL,
      "violated-directive": report.body?.effectiveDirective,
      "blocked-uri": report.body?.blockedURL,
      "original-policy": report.body?.originalPolicy,
      "line-number": report.body?.lineNumber,
      "column-number": report.body?.columnNumber,
      "source-file": report.body?.sourceFile,
      sample: report.body?.sample,
      disposition: report.body?.disposition,
      "user-agent": report.user_agent,
      timestamp: new Date().toISOString(),
    });

    return new Response("Report received", { status: 200 });
  } catch (error) {
    console.error("Error processing CSP violation report:", error);
    return new Response("Error processing report", { status: 400 });
  }
}
