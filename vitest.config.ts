import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (relativePath: string): string =>
    resolve(rootDir, relativePath);

export default defineConfig({
    test: {
        coverage: {
            include: ["src/**"],
            exclude: ["src/types/**"],
            provider: "v8",
            reporter: ["text", "html"],
            thresholds: {
                statements: 80,
                branches: 80,
                functions: 80,
                lines: 80,
            },
        },
        environment: "jsdom",
        setupFiles: ["./tests/globalSetup.ts"],
        // Support TypeScript files in tests
        include: ["**/*.{test,spec}.{js,ts}"],
        // Ensure TypeScript files are processed
        globals: true,
    },
    // Enable TypeScript support for tests
    esbuild: {
        include: /\.(js|ts)$/,
        target: "es2022",
    },
    // Resolve TypeScript files and aliases
    resolve: {
        alias: {
            "@": resolveFromRoot("./src"),
            "@backend": resolveFromRoot("./src/backend"),
            "@frontend": resolveFromRoot("./src/frontend"),
        },
        extensions: [".js", ".ts", ".json"],
    },
});
