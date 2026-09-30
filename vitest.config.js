import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/Frontend/**/*.test.{js,jsx}"],
    setupFiles: ["tests/Frontend/setup.js"],
  },
});
