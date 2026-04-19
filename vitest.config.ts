import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // You can use 'node' or 'jsdom' if you're doing web testing
    environment: "node",
    globals: true,
  },
});
