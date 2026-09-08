import { defineConfig, configDefaults } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { exclude: [...configDefaults.exclude, "**/_decoquote_original_*/**"], testTimeout: 15000, hookTimeout: 30000 },
});
