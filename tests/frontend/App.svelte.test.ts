import App from "@frontend/App.svelte";
import { mount, unmount } from "svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("frontend/App.svelte", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    it("renders the provided message", () => {
        const target = document.createElement("div");
        document.body.appendChild(target);
        const app = mount(App, { target, props: { message: "Hello World" } });
        expect(target.textContent).toContain("Hello World");
        unmount(app);
    });
});
