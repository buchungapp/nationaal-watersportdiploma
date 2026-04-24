/* eslint-disable @typescript-eslint/no-require-imports, no-eval */
const _require = eval("require") as NodeRequire;
const { OTLPTraceExporter } = _require("@opentelemetry/exporter-trace-otlp-http");
const { SimpleSpanProcessor } = _require("@opentelemetry/sdk-trace-node");
const { registerOTel } = _require("@vercel/otel");

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
