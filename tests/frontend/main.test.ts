import { unmount } from "svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("frontend/main.ts", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.resetModules();
        // Clean up any existing #app element
        const existing = document.getElementById("app");
        if (existing) existing.remove();
    });

    it("creates mount target when missing and instantiates app", async () => {
        const mod = await import("@frontend/main");
        const target = document.getElementById("app");
        expect(target).not.toBeNull();
        expect(mod.default).toBeTruthy();
        unmount(mod.default as any);
    });

    it("uses existing mount target when present", async () => {
        const el = document.createElement("div");
        el.id = "app";
        document.body.appendChild(el);
        const mod = await import("@frontend/main");
        const allApps = document.querySelectorAll("#app");
        expect(allApps).toHaveLength(1);
        expect(mod.default).toBeTruthy();
        unmount(mod.default as any);
    });
});
