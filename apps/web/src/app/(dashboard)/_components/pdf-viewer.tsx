"use client";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export function PDFViewer({
  file,
  multiplePages = false,
  children,
}: PropsWithChildren<{
  file?: string | undefined;
  multiplePages?: boolean;
}>) {
  const [width, setWidth] = useState<number | null>(null);
  const pdfWrapperRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);

  const setDivSize = () => {
    if (pdfWrapperRef.current) {
      setWidth(pdfWrapperRef.current.getBoundingClientRect().width - 20);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setDivSize();
    window.addEventListener("resize", setDivSize);
    return () => {
      window.removeEventListener("resize", setDivSize);
    };
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto" ref={pdfWrapperRef}>
      <Document
        file={file}
        loading={<PDFViewerText>Laden...</PDFViewerText>}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {multiplePages ? (
          Array.apply(null, Array(numPages))
            .map((_, i) => i + 1)
            .map((page) => (
              <Page key={page} pageNumber={page} width={width || 200} />
            ))
        ) : (
          <Page
            pageNumber={1}
            width={width || 200}
            className="rounded-md overflow-hidden"
          />
        )}

        {children}
      </Document>
    </div>
  );
}

export function PDFViewerText({ children }: PropsWithChildren) {
  return <p className="my-2 text-gray-500 text-xs text-center">{children}</p>;
}
