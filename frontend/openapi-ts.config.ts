import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "http://127.0.0.1:8000/openapi.json",
  output: "src/client",
  plugins: [
    "@hey-api/typescript",
    {
      name: '@hey-api/client-next',
      runtimeConfigPath: './src/lib/utils/hey-api.ts',
    },
    "@tanstack/react-query",
  ],
});
