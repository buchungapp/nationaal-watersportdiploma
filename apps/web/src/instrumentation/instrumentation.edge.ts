import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { registerOTel } from "@vercel/otel";

registerOTel({
  serviceName: "web",
  spanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: "https://api.axiom.co/v1/traces",
        headers: {
          Authorization: `Bearer ${process.env.AXIOM_API_KEY}`,
          "X-Axiom-Dataset": `${process.env.AXIOM_OTEL_DATASET_NAME}`,
        },
      }),
    ),
  ],
});
