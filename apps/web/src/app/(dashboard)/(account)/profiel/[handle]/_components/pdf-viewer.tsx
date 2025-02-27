"use client";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export function PDFViewer({
  file,
}: {
  file?: string | File | undefined;
}) {
  const [width, setWidth] = useState<number | null>(null);
  const pdfWrapperRef = useRef<HTMLDivElement | null>(null);

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
    <div className="w-full overflow-y-auto h-full" ref={pdfWrapperRef}>
      <Document file={file} loading="Laden...">
        <Page pageNumber={1} width={width || 200} />
      </Document>
    </div>
  );
}
