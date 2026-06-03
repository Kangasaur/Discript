import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Stub static asset imports (e.g. require("...wav")) so the module graph can
// be loaded under vitest without a Metro/Expo asset transformer.
const assetStub = {
  name: "asset-stub",
  enforce: "pre" as const,
  resolveId(id: string) {
    if (/\.(wav|mp3|m4a|aac|png|jpg|jpeg|gif|svg|ttf|otf)$/.test(id)) {
      return "\0asset-stub";
    }
    return null;
  },
  load(id: string) {
    if (id === "\0asset-stub") {
      return "export default 1;";
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), assetStub],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Render React Native components through react-native-web under jsdom.
      "react-native": "react-native-web",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
  },
});
