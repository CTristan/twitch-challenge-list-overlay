import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    DATA_ATTRIBUTES,
    EVENT_NAMES,
    HTML_ATTRIBUTE_NAMES,
    HTML_ATTRIBUTES,
    HTML_ELEMENTS,
} from "../../src/types/DOMConstants";
import { ARIA_LABELS, UI_ELEMENTS } from "../../src/types/MessageConstants";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import { parseColor } from "../../src/utils/ColorUtils";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

// Utility to create a basic challenge for DOM rendering
function createChallenge(
    title: string,
    options: Partial<{
        description: string;
        amount: number;
        progress: number;
        timer: number | string;
        status: ChallengeStatus;
    }> = {}
): Challenge {
    const ch = new Challenge(title, {
        description: options.description ?? "",
        amount: options.amount ?? 1,
        ...(options.timer !== undefined && { timer: options.timer }),
    });
    if (typeof options.progress === "number") ch.progress = options.progress;
    if (options.status !== undefined) ch.setStatus(options.status);
    return ch;
}

describe("ChallengeRenderer", () => {
    beforeEach(() => {
        // Fresh DOM for each test
        document.body.innerHTML = "";
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it("createChallengeTextElement renders title only when description is same and no metadata", () => {
        const ch = createChallenge("Title", {
            description: "Title",
            amount: 1,
        });
        const el = ChallengeRenderer.createChallengeTextElement(ch);

        expect(el.classList.contains(CSS_CLASSES.CHALLENGE_TEXT)).toBe(true);
        const title = el.querySelector(
            CSS_SELECTORS.CHALLENGE_TITLE
        ) as HTMLElement;
        expect(title).toBeTruthy();
        expect(title.textContent).toBe("Title");
        expect(
            el.querySelector(CSS_SELECTORS.CHALLENGE_DESCRIPTION)
        ).toBeNull();
        // No amount and no timer -> no metadata row
        expect(el.querySelector(CSS_SELECTORS.CHALLENGE_METADATA)).toBeNull();
    });

    it("createChallengeTextElement includes description and progress when amount > 1", () => {
        const ch = createChallenge("Title", {
            description: "Desc",
            amount: 3,
            progress: 1,
        });
        const el = ChallengeRenderer.createChallengeTextElement(ch, 2);

        const title = el.querySelector(
            CSS_SELECTORS.CHALLENGE_TITLE
        ) as HTMLElement;
        expect(title.textContent).toBe("2. Title");

        const desc = el.querySelector(
            CSS_SELECTORS.CHALLENGE_DESCRIPTION
        ) as HTMLElement;
        expect(desc.textContent).toBe("Desc");

        const meta = el.querySelector(
            CSS_SELECTORS.CHALLENGE_METADATA
        ) as HTMLElement;
        expect(meta).toBeTruthy();
        const progress = el.querySelector(
            CSS_SELECTORS.CHALLENGE_AMOUNT
        ) as HTMLElement;
        expect(progress).toBeTruthy();
        expect(progress.textContent).toBe("1/3");
    });

    it("createChallengeTextElement creates empty metadata row if timer exists without amount", () => {
        const ch = createChallenge("Timered", { amount: 1, timer: 5 });
        ch.startTimer();
        const el = ChallengeRenderer.createChallengeTextElement(ch);
        const meta = el.querySelector(
            CSS_SELECTORS.CHALLENGE_METADATA
        ) as HTMLElement;
        expect(meta).toBeTruthy();
        // No progress element because amount == 1
        expect(el.querySelector(CSS_SELECTORS.CHALLENGE_AMOUNT)).toBeNull();
    });

    it("createChallengeCheckbox sets checked class when isChecked=true", () => {
        const cb = ChallengeRenderer.createChallengeCheckbox(true);
        expect(cb.classList.contains(CSS_CLASSES.CHALLENGE_CHECKBOX)).toBe(
            true
        );
        expect(cb.classList.contains(CSS_CLASSES.CHECKED)).toBe(true);
    });

    it("createChallengeEditIcon renders icon and text-only variants with accessibility attrs", () => {
        const icon = ChallengeRenderer.createChallengeEditIcon(false);
        expect(icon.classList.contains(CSS_CLASSES.CHALLENGE_EDIT_ICON)).toBe(
            true
        );
        expect(icon.textContent).toBe(UI_ELEMENTS.EDIT_ICON);
        expect(icon.getAttribute(HTML_ATTRIBUTE_NAMES.ROLE)).toBe(
            HTML_ATTRIBUTES.ROLE_BUTTON
        );
        expect(icon.getAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL)).toBe(
            ARIA_LABELS.EDIT_CHALLENGE
        );

        const textBtn = ChallengeRenderer.createChallengeEditIcon(true);
        expect(
            textBtn.classList.contains(CSS_CLASSES.CHALLENGE_TEXT_ONLY_EDIT)
        ).toBe(true);
        expect(textBtn.textContent).toBe(UI_ELEMENTS.TEXT_ONLY_EDIT_BUTTON);
    });

    it("create increment/decrement buttons with proper labels and accessibility", () => {
        const inc = ChallengeRenderer.createChallengeIncrementButton();
        expect(
            inc.classList.contains(CSS_CLASSES.CHALLENGE_INCREMENT_BUTTON)
        ).toBe(true);
        expect(inc.textContent).toBe(UI_ELEMENTS.INCREMENT_BUTTON);
        expect(inc.getAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL)).toBe(
            ARIA_LABELS.INCREMENT_PROGRESS
        );

        const dec = ChallengeRenderer.createChallengeDecrementButton(true);
        expect(
            dec.classList.contains(CSS_CLASSES.CHALLENGE_TEXT_ONLY_DECREMENT)
        ).toBe(true);
        expect(dec.textContent).toBe(UI_ELEMENTS.TEXT_ONLY_DECREMENT_BUTTON);
        expect(dec.getAttribute(HTML_ATTRIBUTE_NAMES.ARIA_LABEL)).toBe(
            ARIA_LABELS.DECREMENT_PROGRESS
        );
    });

    it("createTextOnlyChallengeElement renders content, state classes, and fires handlers", () => {
        const ch = createChallenge("T", {
            description: "D",
            amount: 2,
            progress: 1,
            status: ChallengeStatus.COMPLETED,
        });

        const editHandler = vi.fn();
        const incHandler = vi.fn();
        const decHandler = vi.fn();
        const uncompleteHandler = vi.fn();
        const failHandler = vi.fn();

        const el = ChallengeRenderer.createTextOnlyChallengeElement(ch, {
            editHandler,
            incrementHandler: incHandler,
            decrementHandler: decHandler,
            uncompleteHandler,
            failHandler,
            displayPosition: 1,
        });

        expect(
            el.classList.contains(CSS_CLASSES.CHALLENGE_TEXT_ONLY_ITEM)
        ).toBe(true);
        expect(el.dataset[DATA_ATTRIBUTES.CHALLENGE_ID]).toBe(ch.id);
        expect(el.classList.contains(CSS_CLASSES.DONE)).toBe(true);

        // Content shows title, description and progress
        const content = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_CONTENT}`
        ) as HTMLElement;
        expect(content.textContent).toContain("1. T");
        expect(content.textContent).toContain("D");
        expect(content.textContent).toContain("1/2");

        // Buttons exist and wired
        const btns = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_BUTTONS}`
        )!;

        const edit = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_EDIT}`
        ) as HTMLElement;
        edit.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(editHandler).toHaveBeenCalledTimes(1);

        // Keydown Enter triggers click for accessibility
        edit.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(editHandler).toHaveBeenCalledTimes(2);

        const uncomplete = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNCOMPLETE}`
        ) as HTMLElement;
        uncomplete.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(uncompleteHandler).toHaveBeenCalledTimes(1);

        const inc = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_INCREMENT}`
        ) as HTMLElement;
        inc.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(incHandler).toHaveBeenCalledTimes(1);

        const dec = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DECREMENT}`
        ) as HTMLElement;
        dec.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(decHandler).toHaveBeenCalledTimes(1);

        // Not failed -> Fail button rendered
        const fail = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL}`
        ) as HTMLElement;
        fail.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(failHandler).toHaveBeenCalledTimes(1);
    });

    it("createTextOnlyChallengeElement shows Unfail when failed", () => {
        const ch = createChallenge("T", { status: ChallengeStatus.FAILED });
        const unfailHandler = vi.fn();
        const el = ChallengeRenderer.createTextOnlyChallengeElement(ch, {
            unfailHandler,
        });
        expect(el.classList.contains(CSS_CLASSES.FAILED)).toBe(true);
        const btns = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_BUTTONS}`
        )!;
        const unfail = btns.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL}`
        ) as HTMLElement;
        unfail.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(unfailHandler).toHaveBeenCalledTimes(1);
    });

    it("createChallengeElement wires checkbox, edit icon style by mode, inc/dec and fail button", () => {
        const ch = createChallenge("T", { amount: 3, progress: 1 });

        const checkboxHandler = vi.fn();
        const editHandler = vi.fn();
        const incHandler = vi.fn();
        const decHandler = vi.fn();
        const failHandler = vi.fn();

        const el = ChallengeRenderer.createChallengeElement(ch, {
            includeEventListeners: true,
            eventHandler: checkboxHandler,
            editHandler,
            incrementHandler: incHandler,
            decrementHandler: decHandler,
            failHandler,
            textOnlyMode: true,
        });

        // Checkbox click delegates
        const cb = el.querySelector(
            CSS_SELECTORS.CHALLENGE_CHECKBOX
        ) as HTMLElement;
        cb.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(checkboxHandler).toHaveBeenCalledTimes(1);

        // Edit icon is text-only when textOnlyMode=true
        const edit = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_EDIT}`
        ) as HTMLElement;
        expect(edit).toBeTruthy();
        edit.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(editHandler).toHaveBeenCalledTimes(1);

        // Inc/Dec exist and wired
        const inc = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_INCREMENT}`
        ) as HTMLElement;
        const dec = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_DECREMENT}`
        ) as HTMLElement;
        expect(inc && dec).toBeTruthy();
        inc.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        dec.dispatchEvent(new Event(EVENT_NAMES.CLICK));
        expect(incHandler).toHaveBeenCalledTimes(1);
        expect(decHandler).toHaveBeenCalledTimes(1);

        // Fail button exists (state not failed)
        const failBtn = el.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL}`
        ) as HTMLButtonElement;
        expect(failBtn.tagName.toLowerCase()).toBe(HTML_ELEMENTS.BUTTON);
        expect(failBtn.textContent).toBe(UI_ELEMENTS.TEXT_ONLY_FAIL_BUTTON);
        failBtn.click();
        expect(failHandler).toHaveBeenCalledTimes(1);
    });

    it("createChallengeElement does not render Fail button when already failed", () => {
        const ch = createChallenge("T", { status: ChallengeStatus.FAILED });
        const el = ChallengeRenderer.createChallengeElement(ch, {
            failHandler: vi.fn(),
        });
        expect(
            el.querySelector(`.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL}`)
        ).toBeNull();
    });

    it("applyChallengeRowColors sets background and returns text color", () => {
        const li = document.createElement("li");
        const text = ChallengeRenderer.applyChallengeRowColors(
            li,
            2,
            ["#ff0000", "#00ff00"],
            ["#111111", "#222222"]
        );
        expect(li.style.backgroundColor.length).toBeGreaterThan(0);
        expect(text).toBe("#111111"); // index 2 -> rotates to 0
    });

    it("decorateChallengeCheckbox applies CSS custom properties", () => {
        const cb = document.createElement("div");
        ChallengeRenderer.decorateChallengeCheckbox(cb, "#abcdef");
        expect(
            cb.style.getPropertyValue("--challenge-checkbox-border-color")
        ).toBe("#abcdef");
        expect(
            cb.style.getPropertyValue(
                "--challenge-checkbox-checked-border-color"
            )
        ).toBe("#abcdef");
        expect(
            cb.style.getPropertyValue("--challenge-checkbox-checkmark-color")
        ).toBe("#abcdef");
    });

    it("applyChallengeTextColors applies to container and children", () => {
        const ch = createChallenge("T", {
            description: "D",
            amount: 2,
            progress: 1,
        });
        const textEl = ChallengeRenderer.createChallengeTextElement(ch);
        ChallengeRenderer.applyChallengeTextColors(textEl, "#123456");

        // jsdom normalizes colors to rgb(...)
        expect(parseColor(textEl.style.color)).toEqual(parseColor("#123456"));
        const title = textEl.querySelector(
            CSS_SELECTORS.CHALLENGE_TITLE
        ) as HTMLElement;
        const desc = textEl.querySelector(
            CSS_SELECTORS.CHALLENGE_DESCRIPTION
        ) as HTMLElement;
        const prog = textEl.querySelector(
            CSS_SELECTORS.CHALLENGE_AMOUNT
        ) as HTMLElement;
        expect(parseColor(title.style.color)).toEqual(parseColor("#123456"));
        expect(parseColor(desc.style.color)).toEqual(parseColor("#123456"));
        expect(parseColor(prog.style.color)).toEqual(parseColor("#123456"));
    });

    it("applyBackgroundCustomization uses row-specific colors and text color", () => {
        const ch = createChallenge("T", { amount: 2, progress: 1 });
        const el = ChallengeRenderer.createChallengeElement(ch, {
            includeEventListeners: false,
        });

        ChallengeRenderer.applyBackgroundCustomization(
            el as HTMLElement,
            {
                // Global overrides should be ignored due to row-specific values
                challengeBackgroundColor: "#ff00ff",
                challengeTextColor: "#000000",
                challengeTextShadow: false,
            },
            0,
            ["#00ff00"],
            ["#333333"],
            0.5
        );

        // Background applied with opacity
        expect(el.style.backgroundColor).toMatch(
            /rgba\(\s*0,\s*255,\s*0,\s*0\.5\s*\)/
        );
        expect(el.classList.contains(CSS_CLASSES.CUSTOM_BACKGROUND)).toBe(true);

        // Text element styled using row text color
        const textEl = el.querySelector(
            CSS_SELECTORS.CHALLENGE_TEXT
        ) as HTMLElement;
        expect(parseColor(textEl.style.color)).toEqual(parseColor("#333333"));

        // Checkbox decorated with text color
        const cb = el.querySelector(
            CSS_SELECTORS.CHALLENGE_CHECKBOX
        ) as HTMLElement;
        expect(
            cb.style.getPropertyValue("--challenge-checkbox-border-color")
        ).toBe("#333333");
    });

    it("applyBackgroundCustomization uses global settings, default opacity, and text shadow classes", () => {
        const ch = createChallenge("T", { amount: 1 });
        const el = ChallengeRenderer.createChallengeElement(ch);

        ChallengeRenderer.applyBackgroundCustomization(el as HTMLElement, {
            challengeBackgroundColor: "#0000ff",
            // Omit opacity -> uses default 0.7
            challengeTextColor: "#000000", // dark -> expect LIGHT shadow class
            challengeTextShadow: true,
        });

        expect(el.style.backgroundColor).toMatch(
            /rgba\(\s*0,\s*0,\s*255,\s*0\.7\s*\)/
        );

        const textEl = el.querySelector(
            CSS_SELECTORS.CHALLENGE_TEXT
        ) as HTMLElement;
        expect(parseColor(textEl.style.color)).toEqual(parseColor("#000000"));
        expect(
            textEl.style.textShadow && textEl.style.textShadow.length
        ).toBeGreaterThan(0);
        expect(
            textEl.classList.contains(CSS_CLASSES.ENHANCED_READABILITY)
        ).toBe(true);
        expect(textEl.classList.contains(CSS_CLASSES.TEXT_SHADOW_LIGHT)).toBe(
            true
        );
        expect(textEl.classList.contains(CSS_CLASSES.TEXT_SHADOW_DARK)).toBe(
            false
        );
    });
});

describe("ChallengeRenderer", () => {
    beforeEach(() => {
        ensureTestIsolation();
    });

    describe("createChallengeTextElement", () => {
        it("should create proper DOM structure for challenge with title only", () => {
            const challenge = new Challenge("Test Title");
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            // Should not have description or progress elements
            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeNull();

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should include display position prefix when provided", () => {
            const challenge = new Challenge("Test Title");
            const textElement = ChallengeRenderer.createChallengeTextElement(
                challenge,
                1
            );

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("1. Test Title");
        });

        it("should format display position correctly for different numbers", () => {
            const challenge = new Challenge("Test Title");

            // Test position 5
            const textElement5 = ChallengeRenderer.createChallengeTextElement(
                challenge,
                5
            );
            const titleElement5 =
                textElement5.querySelector(".challenge-title");
            expect(titleElement5?.textContent).toBe("5. Test Title");

            // Test position 10
            const textElement10 = ChallengeRenderer.createChallengeTextElement(
                challenge,
                10
            );
            const titleElement10 =
                textElement10.querySelector(".challenge-title");
            expect(titleElement10?.textContent).toBe("10. Test Title");
        });

        it("should not include prefix when display position is undefined", () => {
            const challenge = new Challenge("Test Title");
            const textElement = ChallengeRenderer.createChallengeTextElement(
                challenge,
                undefined
            );

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");
        });

        it("should create proper DOM structure for challenge with title and description", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            // Should not have progress element for amount=1
            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeNull();
        });

        it("should include display position with description", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
            });
            const textElement = ChallengeRenderer.createChallengeTextElement(
                challenge,
                2
            );

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("2. Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement?.textContent).toBe("Test Description");
        });

        it("should create proper DOM structure for challenge with progress", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 5,
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            expect(textElement.classList.contains("challenge-text")).toBe(true);

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = textElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement).toBeTruthy();
            expect(progressElement?.textContent).toBe("0/5");
        });

        it("should include display position with progress indicator", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 5,
            });
            const textElement = ChallengeRenderer.createChallengeTextElement(
                challenge,
                3
            );

            const titleElement = textElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("3. Test Title");

            const progressElement =
                textElement.querySelector(".challenge-amount");
            expect(progressElement?.textContent).toBe("0/5");
        });

        it("should not include timer in text element", () => {
            const challenge = new Challenge("Test Title", {
                timer: "10s",
            });
            const textElement =
                ChallengeRenderer.createChallengeTextElement(challenge);

            // Timer should NOT be included in text element (it's added separately)
            const timerElement = textElement.querySelector(".challenge-timer");
            expect(timerElement).toBeNull();
        });
    });

    describe("createChallengeCheckbox", () => {
        it("should create unchecked checkbox by default", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox();

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(false);
        });

        it("should create checked checkbox when specified", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox(true);

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(true);
        });

        it("should create unchecked checkbox when explicitly false", () => {
            const checkbox = ChallengeRenderer.createChallengeCheckbox(false);

            expect(checkbox.classList.contains("challenge-checkbox")).toBe(
                true
            );
            expect(checkbox.classList.contains("checked")).toBe(false);
        });
    });

    describe("createChallengeElement", () => {
        it("should create complete challenge element with all components", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 3,
            });

            const challengeElement =
                ChallengeRenderer.createChallengeElement(challenge);

            expect(challengeElement.tagName).toBe("LI");
            expect(challengeElement.classList.contains("challenge")).toBe(true);
            expect(challengeElement.dataset["challengeId"]).toBe(challenge.id);

            // Should have checkbox
            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox).toBeTruthy();

            // Should have text element
            const textElement =
                challengeElement.querySelector(".challenge-text");
            expect(textElement).toBeTruthy();

            // Should have title, description, and progress
            const titleElement =
                challengeElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("Test Title");

            const descriptionElement = challengeElement.querySelector(
                ".challenge-description"
            );
            expect(descriptionElement?.textContent).toBe("Test Description");

            const progressElement =
                challengeElement.querySelector(".challenge-amount");
            expect(progressElement?.textContent).toBe("0/3");
        });

        it("should include display position when provided in options", () => {
            const challenge = new Challenge("Test Title", {
                description: "Test Description",
                amount: 3,
            });

            const challengeElement = ChallengeRenderer.createChallengeElement(
                challenge,
                {
                    displayPosition: 4,
                }
            );

            const titleElement =
                challengeElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("4. Test Title");
        });

        it("should not include display position when not provided", () => {
            const challenge = new Challenge("Test Title");

            const challengeElement =
                ChallengeRenderer.createChallengeElement(challenge);

            const titleElement =
                challengeElement.querySelector(".challenge-title");
            expect(titleElement?.textContent).toBe("Test Title");
        });

        it("should mark completed challenges with done class", () => {
            const challenge = new Challenge("Test Title");
            challenge.setStatus(ChallengeStatus.COMPLETED);

            const challengeElement =
                ChallengeRenderer.createChallengeElement(challenge);

            expect(challengeElement.classList.contains("done")).toBe(true);

            const checkbox = challengeElement.querySelector(
                ".challenge-checkbox"
            );
            expect(checkbox?.classList.contains("checked")).toBe(true);
        });
    });

    describe("applyChallengeRowColors", () => {
        let listItem: HTMLElement;

        beforeEach(() => {
            listItem = document.createElement("li");
        });

        it("should return null when no colors are configured", () => {
            const textColor = ChallengeRenderer.applyChallengeRowColors(
                listItem,
                0,
                [],
                []
            );

            expect(textColor).toBeNull();
            expect(listItem.style.backgroundColor).toBe("");
        });

        it("should apply background color and return text color when configured", () => {
            const rowColors = ["#ff0000", "#00ff00"];
            const rowTextColors = ["#ffffff", "#000000"];

            const textColor = ChallengeRenderer.applyChallengeRowColors(
                listItem,
                0,
                rowColors,
                rowTextColors
            );

            expect(textColor).toBe("#ffffff");
            expect(listItem.style.backgroundColor).toBe("rgb(255, 0, 0)");
        });

        it("should rotate through colors based on index", () => {
            const rowColors = ["#ff0000", "#00ff00"];
            const rowTextColors = ["#ffffff", "#000000"];

            const textColor = ChallengeRenderer.applyChallengeRowColors(
                listItem,
                1,
                rowColors,
                rowTextColors
            );

            expect(textColor).toBe("#000000");
            expect(listItem.style.backgroundColor).toBe("rgb(0, 255, 0)");
        });

        it("should handle background colors without text colors", () => {
            const rowColors = ["#ff0000"];

            const textColor = ChallengeRenderer.applyChallengeRowColors(
                listItem,
                0,
                rowColors,
                []
            );

            expect(textColor).toBeNull();
            expect(listItem.style.backgroundColor).toBe("rgb(255, 0, 0)");
        });
    });

    describe("decorateChallengeCheckbox", () => {
        let checkbox: HTMLElement;

        beforeEach(() => {
            checkbox = document.createElement("div");
        });

        it("should not apply styling when textColor is null", () => {
            ChallengeRenderer.decorateChallengeCheckbox(checkbox, null);

            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe("");
            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-checked-border-color"
                )
            ).toBe("");
            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-checkmark-color"
                )
            ).toBe("");
        });

        it("should apply CSS custom properties when textColor is provided", () => {
            const textColor = "#ff0000";

            ChallengeRenderer.decorateChallengeCheckbox(checkbox, textColor);

            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-border-color"
                )
            ).toBe(textColor);
            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-checked-border-color"
                )
            ).toBe(textColor);
            expect(
                checkbox.style.getPropertyValue(
                    "--challenge-checkbox-checkmark-color"
                )
            ).toBe(textColor);
        });
    });

    describe("applyChallengeTextColors", () => {
        let textElement: HTMLElement;

        beforeEach(() => {
            textElement = document.createElement("div");
            textElement.classList.add("challenge-text");
        });

        it("should not apply styling when textColor is null", () => {
            ChallengeRenderer.applyChallengeTextColors(textElement, null);

            expect(textElement.style.color).toBe("");
        });

        it("should apply color to text element when textColor is provided", () => {
            const textColor = "#ff0000";

            ChallengeRenderer.applyChallengeTextColors(textElement, textColor);

            expect(textElement.style.color).toBe("rgb(255, 0, 0)");
        });

        it("should apply color to child elements when they exist", () => {
            const titleElement = document.createElement("div");
            titleElement.classList.add("challenge-title");
            const descriptionElement = document.createElement("div");
            descriptionElement.classList.add("challenge-description");
            const progressElement = document.createElement("div");
            progressElement.classList.add("challenge-amount");

            textElement.appendChild(titleElement);
            textElement.appendChild(descriptionElement);
            textElement.appendChild(progressElement);

            const textColor = "#00ff00";
            ChallengeRenderer.applyChallengeTextColors(textElement, textColor);

            expect(textElement.style.color).toBe("rgb(0, 255, 0)");
            expect(titleElement.style.color).toBe("rgb(0, 255, 0)");
            expect(descriptionElement.style.color).toBe("rgb(0, 255, 0)");
            expect(progressElement.style.color).toBe("rgb(0, 255, 0)");
        });

        it("should handle missing child elements gracefully", () => {
            const textColor = "#0000ff";

            expect(() => {
                ChallengeRenderer.applyChallengeTextColors(
                    textElement,
                    textColor
                );
            }).not.toThrow();

            expect(textElement.style.color).toBe("rgb(0, 0, 255)");
        });
    });

    describe("applyBackgroundCustomization", () => {
        let challengeElement: HTMLElement;
        let textElement: HTMLElement;
        let checkbox: HTMLElement;

        beforeEach(() => {
            challengeElement = document.createElement("li");
            textElement = document.createElement("div");
            textElement.classList.add("challenge-text");
            checkbox = document.createElement("div");
            checkbox.classList.add("challenge-checkbox");

            challengeElement.appendChild(checkbox);
            challengeElement.appendChild(textElement);
        });

        it("should not apply any styling when no configuration is provided", () => {
            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                {}
            );

            expect(challengeElement.style.backgroundColor).toBe("");
            expect(
                challengeElement.classList.contains("custom-background")
            ).toBe(false);
            expect(textElement.style.color).toBe("");
        });

        it("should apply global background color with default opacity", () => {
            const config = {
                challengeBackgroundColor: "#ff0000",
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(challengeElement.style.backgroundColor).toContain(
                "rgba(255, 0, 0"
            );
            expect(
                challengeElement.classList.contains("custom-background")
            ).toBe(true);
        });

        it("should apply global background color with custom opacity", () => {
            const config = {
                challengeBackgroundColor: "#00ff00",
                challengeBackgroundOpacity: 0.5,
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(challengeElement.style.backgroundColor).toContain(
                "rgba(0, 255, 0"
            );
            expect(challengeElement.style.backgroundColor).toContain("0.5");
        });

        it("should use row colors when provided and override global settings", () => {
            const config = {
                challengeBackgroundColor: "#ff0000",
            };
            const rowColors = ["#0000ff"];
            const rowTextColors = ["#ffffff"];

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config,
                0,
                rowColors,
                rowTextColors
            );

            expect(challengeElement.style.backgroundColor).toBe(
                "rgb(0, 0, 255)"
            );
        });

        it("should apply manual text color when configured", () => {
            const config = {
                challengeBackgroundColor: "#ff0000",
                challengeTextColor: "#ffffff",
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(textElement.style.color).toBe("rgb(255, 255, 255)");
        });

        it("should calculate auto text color when enabled", () => {
            const config = {
                challengeBackgroundColor: "#000000",
                challengeAutoTextColor: true,
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            // Should calculate a light color for dark background
            expect(textElement.style.color).toBeTruthy();
        });

        it("should apply text shadow when enabled", () => {
            const config = {
                challengeBackgroundColor: "#ff0000",
                challengeTextColor: "#ffffff",
                challengeTextShadow: true,
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(textElement.style.textShadow).toBeTruthy();
            expect(textElement.classList.contains("enhanced-readability")).toBe(
                true
            );
        });

        it("should apply light shadow class for dark text", () => {
            const config = {
                challengeBackgroundColor: "#ffffff",
                challengeTextColor: "#000000",
                challengeTextShadow: true,
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(textElement.classList.contains("text-shadow-light")).toBe(
                true
            );
            expect(textElement.classList.contains("text-shadow-dark")).toBe(
                false
            );
        });

        it("should apply dark shadow class for light text", () => {
            const config = {
                challengeBackgroundColor: "#000000",
                challengeTextColor: "#ffffff",
                challengeTextShadow: true,
            };

            ChallengeRenderer.applyBackgroundCustomization(
                challengeElement,
                config
            );

            expect(textElement.classList.contains("text-shadow-dark")).toBe(
                true
            );
            expect(textElement.classList.contains("text-shadow-light")).toBe(
                false
            );
        });

        it("should handle missing text element gracefully", () => {
            const challengeElementWithoutText = document.createElement("li");
            const config = {
                challengeBackgroundColor: "#ff0000",
                challengeTextColor: "#ffffff",
            };

            expect(() => {
                ChallengeRenderer.applyBackgroundCustomization(
                    challengeElementWithoutText,
                    config
                );
            }).not.toThrow();
        });

        it("should handle missing checkbox element gracefully", () => {
            const challengeElementWithoutCheckbox =
                document.createElement("li");
            const textEl = document.createElement("div");
            textEl.classList.add("challenge-text");
            challengeElementWithoutCheckbox.appendChild(textEl);

            const config = {
                challengeBackgroundColor: "#ff0000",
                challengeTextColor: "#ffffff",
            };

            expect(() => {
                ChallengeRenderer.applyBackgroundCustomization(
                    challengeElementWithoutCheckbox,
                    config
                );
            }).not.toThrow();
        });
    });
});
