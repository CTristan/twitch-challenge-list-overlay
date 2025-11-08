import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (relativePath: string): string =>
    resolve(rootDir, relativePath);

// Temporary cast to avoid Vite type version mismatch between Vitest and Vite
const sveltePlugin = svelte({
    // Force client build to avoid importing server entry (which lacks mount)
    // during tests; jsdom provides a DOM.
    compilerOptions: {
        // ensure dev mode disabled for performance; adjust if needed
        dev: false,
    },
}) as unknown as any;

export default defineConfig({
    plugins: [sveltePlugin],
    test: {
        coverage: {
            enabled: true,
            include: ["src/**"],
            exclude: [
                "src/types/**", // Exclude type-only files
                "src/**/index.ts", // Exclude barrel files from coverage calculations
            ],
            provider: "v8",
            reporter: ["text", "json-summary"],
            thresholds: {
                perFile: true,
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
        environment: "jsdom",
        setupFiles: ["./tests/globalSetup.ts"],
        include: ["tests/**/*.{test,spec}.{js,ts}"],
        exclude: ["**/.stryker-tmp/**"],
        globals: true,
        // Ensure we resolve browser fields so svelte runtime chooses client API
        server: {
            deps: {
                fallbackCJS: true,
            },
        },
        testTimeout: 1000,
        hookTimeout: 1000,
        teardownTimeout: 1000,
    },
    // Enable TypeScript support for tests
    esbuild: {
        include: [/src\/.*\.(js|ts)$/, /tests\/.*\.(js|ts)$/],
        target: "es2022",
    },
    // Resolve TypeScript files and aliases
    resolve: {
        alias: {
            "@": resolveFromRoot("./src"),
            "@backend": resolveFromRoot("./src/backend"),
            "@frontend": resolveFromRoot("./src/frontend"),
        },
        conditions: ["browser"],
        extensions: [".js", ".ts", ".svelte", ".json"],
    },
});
