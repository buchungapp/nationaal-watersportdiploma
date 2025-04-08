export async function POST(request: Request) {
  try {
    const report = await request.json();

    // Log the raw report for debugging
    console.log("Raw CSP Report:", JSON.stringify(report, null, 2));

    // Handle both old and new CSP report formats
    const cspReport = report["csp-report"] || report.body || report;

    // Log the CSP violation report with fallbacks for undefined values
    console.error("CSP Violation Report:", {
      "document-uri":
        cspReport?.["document-uri"] || cspReport?.documentURL || "unknown",
      "violated-directive":
        cspReport?.["violated-directive"] ||
        cspReport?.effectiveDirective ||
        "unknown",
      "blocked-uri":
        cspReport?.["blocked-uri"] || cspReport?.blockedURL || "unknown",
      "original-policy":
        cspReport?.["original-policy"] ||
        cspReport?.originalPolicy ||
        "unknown",
      "line-number": cspReport?.["line-number"] || cspReport?.lineNumber || 0,
      "column-number":
        cspReport?.["column-number"] || cspReport?.columnNumber || 0,
      "source-file":
        cspReport?.["source-file"] || cspReport?.sourceFile || "unknown",
      sample: cspReport?.sample || "unknown",
      disposition: cspReport?.disposition || "unknown",
      "user-agent": report.user_agent || "unknown",
      timestamp: new Date().toISOString(),
      "report-type": report.type || "unknown",
      "report-age": report.age || 0,
    });

    return new Response("Report received", { status: 200 });
  } catch (error) {
    console.error("Error processing CSP violation report:", error);
    console.error("Request body:", await request.text());
    return new Response("Error processing report", { status: 400 });
  }
}
