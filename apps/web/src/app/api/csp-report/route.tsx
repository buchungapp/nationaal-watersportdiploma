export async function POST(request: Request) {
  try {
    const report = await request.json();

    // Log the CSP violation report
    console.error("CSP Violation Report:", {
      "document-uri": report["document-uri"],
      "violated-directive": report["violated-directive"],
      "blocked-uri": report["blocked-uri"],
      "original-policy": report["original-policy"],
      timestamp: new Date().toISOString(),
    });

    return new Response("Report received", { status: 200 });
  } catch (error) {
    console.error("Error processing CSP violation report:", error);
    return new Response("Error processing report", { status: 400 });
  }
}
