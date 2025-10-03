import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeRenderer from "../../src/utils/ChallengeRenderer";
import { ensureTestIsolation } from "./chatHandlerTestUtils";

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
            challenge.setCompletionStatus(true);

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
