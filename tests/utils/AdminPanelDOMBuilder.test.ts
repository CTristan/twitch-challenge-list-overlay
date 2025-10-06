import { beforeEach, describe, expect, it } from "vitest";
import { ELEMENT_IDS } from "../../src/types/DOMConstants";
import { AdminPanelDOMBuilder } from "../../src/utils/AdminPanelDOMBuilder";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

describe("AdminPanelDOMBuilder", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("createAuthenticationSection", () => {
        it("should create authentication section HTML with all required fields", () => {
            const html = AdminPanelDOMBuilder.createAuthenticationSection();

            expect(html).toContain(ELEMENT_IDS.TWITCH_OAUTH);
            expect(html).toContain(ELEMENT_IDS.TWITCH_USERNAME);
            expect(html).toContain(ELEMENT_IDS.TWITCH_CHANNEL);
        });

        it("should include OAuth token input with password type", () => {
            const html = AdminPanelDOMBuilder.createAuthenticationSection();

            expect(html).toContain('type="password"');
            expect(html).toContain(ELEMENT_IDS.TWITCH_OAUTH);
        });

        it("should include link to token generator", () => {
            const html = AdminPanelDOMBuilder.createAuthenticationSection();

            expect(html).toContain("twitchtokengenerator.com");
        });

        it("should include username and channel inputs with text type", () => {
            const html = AdminPanelDOMBuilder.createAuthenticationSection();

            expect(html).toContain('type="text"');
            expect(html).toContain(ELEMENT_IDS.TWITCH_USERNAME);
            expect(html).toContain(ELEMENT_IDS.TWITCH_CHANNEL);
        });
    });

    describe("createBehaviorSection", () => {
        it("should create behavior section HTML with max challenges input", () => {
            const html = AdminPanelDOMBuilder.createBehaviorSection();

            expect(html).toContain(ELEMENT_IDS.MAX_CHALLENGES);
        });

        it("should include number input with min and max constraints", () => {
            const html = AdminPanelDOMBuilder.createBehaviorSection();

            expect(html).toContain('type="number"');
            expect(html).toContain('min="1"');
            expect(html).toContain('max="100"');
        });

        it("should include default value of 10", () => {
            const html = AdminPanelDOMBuilder.createBehaviorSection();

            expect(html).toContain('value="10"');
        });
    });

    describe("createChallengeRowStylingSection", () => {
        it("should create challenge row styling section HTML", () => {
            const html =
                AdminPanelDOMBuilder.createChallengeRowStylingSection();

            expect(html).toBeTruthy();
            expect(typeof html).toBe("string");
        });

        it("should include tier-based color configuration elements", () => {
            const html =
                AdminPanelDOMBuilder.createChallengeRowStylingSection();

            // Should contain tier-based color configuration
            expect(html).toContain("Primary Color");
            expect(html).toContain("Secondary Color");
            expect(html).toContain("Tertiary Color");
        });

        it("should include primary color as default (always enabled)", () => {
            const html =
                AdminPanelDOMBuilder.createChallengeRowStylingSection();

            // Primary color should be labeled as default and always enabled
            expect(html).toContain("Primary Color (Default)");
            expect(html).toContain("primary-bg-color");
            expect(html).toContain("primary-text-color");
            // Primary should have expanded class (always visible)
            expect(html).toContain('class="color-pickers-container expanded"');
        });

        it("should include text readability configuration", () => {
            const html =
                AdminPanelDOMBuilder.createChallengeRowStylingSection();

            // Should contain text readability options
            expect(html).toContain("Text Readability");
            expect(html).toContain("challenge-auto-text-color");
            expect(html).toContain("challenge-text-shadow");
        });

        it("should include preview section", () => {
            const html =
                AdminPanelDOMBuilder.createChallengeRowStylingSection();

            // Should contain preview
            expect(html).toContain("background-preview");
            expect(html).toContain("Sample Challenge");
        });
    });

    describe("createOverlayBackgroundSection", () => {
        it("should create overlay background section HTML", () => {
            const html = AdminPanelDOMBuilder.createOverlayBackgroundSection();

            expect(html).toBeTruthy();
            expect(typeof html).toBe("string");
        });

        it("should include overlay background configuration elements", () => {
            const html = AdminPanelDOMBuilder.createOverlayBackgroundSection();

            // Should contain overlay background configuration
            expect(html).toContain("overlay-background-color");
            expect(html).toContain("overlay-background-opacity");
        });

        it("should include description about main container", () => {
            const html = AdminPanelDOMBuilder.createOverlayBackgroundSection();

            // Should describe what it controls
            expect(html).toContain("main container");
        });
    });

    describe("createActionsSection", () => {
        it("should create actions section HTML with all buttons", () => {
            const html = AdminPanelDOMBuilder.createActionsSection();

            expect(html).toContain(ELEMENT_IDS.EXPORT_JSON_BTN);
            expect(html).toContain(ELEMENT_IDS.IMPORT_CONFIG_BTN);
            expect(html).toContain(ELEMENT_IDS.RESET_CONFIG_BTN);
        });

        it("should include backup configuration button", () => {
            const html = AdminPanelDOMBuilder.createActionsSection();

            expect(html).toContain("Backup Configuration");
        });

        it("should include restore configuration button", () => {
            const html = AdminPanelDOMBuilder.createActionsSection();

            expect(html).toContain("Restore Configuration");
        });

        it("should include reset to defaults button", () => {
            const html = AdminPanelDOMBuilder.createActionsSection();

            expect(html).toContain("Reset to Defaults");
        });
    });

    describe("createDangerZoneSection", () => {
        it("should create danger zone section HTML", () => {
            const html = AdminPanelDOMBuilder.createDangerZoneSection();

            expect(html).toContain(ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN);
        });

        it("should include warning message", () => {
            const html = AdminPanelDOMBuilder.createDangerZoneSection();

            expect(html).toContain("permanently delete");
            expect(html).toContain("cannot be undone");
        });

        it("should include clear all data button", () => {
            const html = AdminPanelDOMBuilder.createDangerZoneSection();

            expect(html).toContain("Clear All Data");
        });

        it("should include danger button class", () => {
            const html = AdminPanelDOMBuilder.createDangerZoneSection();

            expect(html).toContain("danger");
        });
    });
});
