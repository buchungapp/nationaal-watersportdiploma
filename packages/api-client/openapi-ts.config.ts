export default {
  input: {
    path: "../../apps/docs/api/import-session.openapi.yaml",
  },
  output: {
    clean: true,
    module: {
      extension: ".ts",
    },
    path: "./src/generated",
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      baseUrl: "https://api.nationaalwatersportdiploma.nl",
    },
    {
      name: "@hey-api/sdk",
      operations: {
        methods: "static",
        strategy: "byTags",
      },
    },
    "@hey-api/typescript",
  ],
};
