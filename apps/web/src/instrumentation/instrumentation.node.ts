// Use eval("require") so Turbopack cannot statically analyse the
// module specifiers.  These packages are in serverExternalPackages
// and will be resolved by Node.js at runtime.
/* eslint-disable @typescript-eslint/no-require-imports, no-eval */
const _require = eval("require") as NodeRequire;

const {
  getNodeAutoInstrumentations,
} = _require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = _require("@opentelemetry/exporter-trace-otlp-http");
const {
  resourceFromAttributes,
} = _require("@opentelemetry/resources");
const { NodeSDK } = _require("@opentelemetry/sdk-node");
const {
  SimpleSpanProcessor,
} = _require("@opentelemetry/sdk-trace-node");
const {
  ATTR_SERVICE_NAME,
} = _require("@opentelemetry/semantic-conventions");

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "web",
  }),
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: "https://api.axiom.co/v1/traces",
      headers: {
        Authorization: `Bearer ${process.env.AXIOM_API_KEY}`,
        "X-Axiom-Dataset": `${process.env.AXIOM_OTEL_DATASET_NAME}`,
      },
    }),
  ),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-pg": {
        enhancedDatabaseReporting: true,
      },
    }),
  ],
});

sdk.start();
