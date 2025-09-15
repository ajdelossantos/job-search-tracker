import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setupTests.ts"],
  },
  resolve: {
    alias: {
      "@": resolve(fileURLToPath(new URL("./", import.meta.url)), "src"),
    },
  },
});
