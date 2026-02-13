import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();
export default function PdfPreview({ url }: { url: string }) {
  return (
    <div>
      <Document file={url} onLoadError={(e) => console.log("PDF error:", e)}>
        <Page pageNumber={1} scale={1.3} />
      </Document>
    </div>
  );
}
