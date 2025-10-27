import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { PluginOption, UserConfig } from "vite";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (relativePath: string): string =>
    resolve(rootDir, relativePath);

// Temporary cast until the plugin updates its Vite v6 typings.
const sveltePlugin = svelte() as unknown as PluginOption;

export default defineConfig({
    plugins: [sveltePlugin],
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
        alias: {
            "@": resolveFromRoot("./src"),
            "@backend": resolveFromRoot("./src/backend"),
            "@frontend": resolveFromRoot("./src/frontend"),
        },
        extensions: [".js", ".ts", ".json"],
    },
} satisfies UserConfig);
