import type { UserConfig } from "vite";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    lib: {
      entry: "src/index.ts",
      name: "challengeBot",
      formats: ["iife"],
      fileName: "challengeBot",
    },
    // Ensure TypeScript files are processed correctly
    rollupOptions: {
      external: [],
      output: {
        // Maintain single file output
        inlineDynamicImports: true,
      },
    },
  },
  publicDir: false,
  // Enable TypeScript support
  esbuild: {
    // Support both .js and .ts files
    include: /\.(js|ts)$/,
    exclude: [],
    // Maintain ES6+ target for modern browsers
    target: "es2022",
  },
  // Resolve TypeScript files
  resolve: {
    extensions: [".js", ".ts", ".json"],
  },
} satisfies UserConfig);
