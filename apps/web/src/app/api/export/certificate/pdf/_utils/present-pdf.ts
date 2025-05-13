export function presentPDF(
  filename: string,
  data: ReadableStream,
  type: "download" | "preview",
) {
  const types = {
    download: "attachment",
    preview: "inline",
  };

  return new Response(data, {
    status: 201,
    headers: {
      "Content-Disposition": `${types[type]}; filename="${filename}"`,
      "Content-Type": "application/pdf",
    },
  });
}
