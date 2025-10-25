import { beforeEach, describe, expect, it, vi } from "vitest";
import { BEHAVIOR_CONFIG } from "../../src/types/ConfigConstants";
import {
    CSS_CLASSES,
    DATA_ATTRIBUTES,
    EVENT_NAMES,
    HTML_ATTRIBUTE_NAMES,
    URL_HASH,
} from "../../src/types/DOMConstants";
import { ARIA_LABELS, UI_ELEMENTS } from "../../src/types/MessageConstants";
import { TIMING_CONSTANTS } from "../../src/types/NumericConstants";
import * as windowRefresh from "../../src/utils/windowRefresh";
import { createTestApp } from "../utils/domTestUtils";

describe("Delete confirmation flow", () => {
    beforeEach(() => {
        window.location.hash = URL_HASH.ADMIN;
    });

    it("requires confirmation before deleting in standard admin mode", () => {
        const notifySpy = vi
            .spyOn(windowRefresh, "notifyChallengeStateChanged")
            .mockImplementation(() => {});
        const { app } = createTestApp("deleteConfirmStandard");

        try {
            app.getConfigManager().reset();
            app.challengeList.addChallenges(["Delete me"]);
            app.renderChallengeList();

            const deleteButton = document.querySelector<HTMLElement>(
                `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE}`
            );
            expect(deleteButton).toBeTruthy();
            if (!deleteButton) {
                throw new Error("Delete button not rendered");
            }

            deleteButton.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(
                deleteButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBe("true");
            expect(deleteButton.textContent).toBe(
                UI_ELEMENTS.DELETE_CONFIRM_PROMPT
            );
            expect(
                deleteButton.classList.contains(
                    CSS_CLASSES.CHALLENGE_DELETE_CONFIRM
                )
            ).toBe(true);
            expect(app.challengeList.totalChallenges).toBe(1);
            expect(notifySpy).not.toHaveBeenCalled();

            deleteButton.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(app.challengeList.totalChallenges).toBe(0);
            expect(notifySpy).toHaveBeenCalledTimes(1);
        } finally {
            notifySpy.mockRestore();
        }
    });

    it("requires confirmation before deleting in text-only admin mode", () => {
        const notifySpy = vi
            .spyOn(windowRefresh, "notifyChallengeStateChanged")
            .mockImplementation(() => {});
        const { app } = createTestApp("deleteConfirmTextOnly");

        try {
            const configManager = app.getConfigManager();
            configManager.reset();
            configManager.set(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE, true);

            app.challengeList.addChallenges(["Delete me"]);
            app.renderChallengeList();

            const deleteAction = document.querySelector<HTMLElement>(
                `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE}`
            );
            expect(deleteAction).toBeTruthy();
            if (!deleteAction) {
                throw new Error("Delete action not rendered");
            }

            deleteAction.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(
                deleteAction.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBe("true");
            expect(deleteAction.textContent).toBe(
                UI_ELEMENTS.DELETE_CONFIRM_PROMPT
            );
            expect(
                deleteAction.classList.contains(
                    CSS_CLASSES.CHALLENGE_DELETE_CONFIRM
                )
            ).toBe(true);
            expect(app.challengeList.totalChallenges).toBe(1);
            expect(notifySpy).not.toHaveBeenCalled();

            deleteAction.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(app.challengeList.totalChallenges).toBe(0);
            expect(notifySpy).toHaveBeenCalledTimes(1);
        } finally {
            notifySpy.mockRestore();
        }
    });

    it("clears existing confirmation when another delete is clicked", () => {
        const notifySpy = vi
            .spyOn(windowRefresh, "notifyChallengeStateChanged")
            .mockImplementation(() => {});
        const { app } = createTestApp("deleteConfirmReset");

        try {
            app.getConfigManager().reset();

            app.challengeList.addChallenges(["First", "Second"]);
            app.renderChallengeList();

            const deleteButtons = Array.from(
                document.querySelectorAll<HTMLElement>(
                    `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE}`
                )
            );
            expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

            const [firstButton, secondButton] = deleteButtons;

            if (!firstButton || !secondButton) {
                throw new Error("Delete buttons not rendered");
            }

            firstButton.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(
                firstButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBe("true");

            secondButton.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(
                secondButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBe("true");
            expect(secondButton.textContent).toBe(
                UI_ELEMENTS.DELETE_CONFIRM_PROMPT
            );
            expect(
                secondButton.classList.contains(
                    CSS_CLASSES.CHALLENGE_DELETE_CONFIRM
                )
            ).toBe(true);

            expect(
                firstButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBeUndefined();
            expect(firstButton.textContent).toBe(
                UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON
            );
            expect(
                firstButton.classList.contains(
                    CSS_CLASSES.CHALLENGE_DELETE_CONFIRM
                )
            ).toBe(false);

            expect(app.challengeList.totalChallenges).toBe(2);
            expect(notifySpy).not.toHaveBeenCalled();
        } finally {
            notifySpy.mockRestore();
        }
    });

    it("resets confirmation state after the timeout expires", () => {
        vi.useFakeTimers();

        const notifySpy = vi
            .spyOn(windowRefresh, "notifyChallengeStateChanged")
            .mockImplementation(() => {});
        const { app } = createTestApp("deleteConfirmTimeout");

        try {
            app.getConfigManager().reset();

            app.challengeList.addChallenges(["Timeout Challenge"]);
            app.renderChallengeList();

            const deleteButton = document.querySelector<HTMLElement>(
                `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DELETE}`
            );

            expect(deleteButton).toBeTruthy();
            if (!deleteButton) {
                throw new Error("Delete button not rendered");
            }

            deleteButton.dispatchEvent(
                new Event(EVENT_NAMES.CLICK, { bubbles: true })
            );

            expect(
                deleteButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBe("true");

            vi.advanceTimersByTime(
                TIMING_CONSTANTS.DELETE_CONFIRMATION_TIMEOUT
            );

            expect(
                deleteButton.dataset[
                    DATA_ATTRIBUTES.DELETE_CONFIRM_PENDING
                ]
            ).toBeUndefined();
            expect(deleteButton.textContent).toBe(
                UI_ELEMENTS.TEXT_ONLY_DELETE_BUTTON
            );
            expect(
                deleteButton.classList.contains(
                    CSS_CLASSES.CHALLENGE_DELETE_CONFIRM
                )
            ).toBe(false);
            expect(
                deleteButton.getAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL)
            ).toBe(ARIA_LABELS.DELETE_CHALLENGE);
            expect(app.challengeList.totalChallenges).toBe(1);
            expect(notifySpy).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
            notifySpy.mockRestore();
        }
    });
});
