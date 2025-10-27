import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { CSS_CLASSES, ELEMENT_IDS } from "../../src/types/DOMConstants";
import { ERROR_MESSAGES } from "../../src/types/MessageConstants";
import { TimerEndBehavior } from "../../src/types/TimerEndBehavior";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";
import { setupChallengeTestDOM } from "../utils/domTestUtils";

type ChallengeFormData = {
    title: string;
    description?: string;
    amount?: number;
    timer?: string;
    timerEndBehavior?: TimerEndBehavior;
};

type PrivateAppAccess = {
    extractChallengeFormData: () => ChallengeFormData | null;
    clearAddChallengeForm: () => void;
    updateTimerBehaviorVisibility: () => void;
};

describe("Timer end behavior form integration", () => {
    let app: App;
    let appPrivates: PrivateAppAccess;

    beforeEach(() => {
        ensureTestIsolation();
        setupChallengeTestDOM();

        document.body.insertAdjacentHTML(
            "beforeend",
            `
                <div id="${ELEMENT_IDS.ADD_CHALLENGE_MODAL}">
                    <h2 id="${ELEMENT_IDS.ADD_CHALLENGE_MODAL_TITLE}"></h2>
                    <form id="${ELEMENT_IDS.ADD_CHALLENGE_FORM}">
                        <input id="${ELEMENT_IDS.ADD_CHALLENGE_TITLE}" />
                        <textarea id="${ELEMENT_IDS.ADD_CHALLENGE_DESCRIPTION}"></textarea>
                        <input id="${ELEMENT_IDS.ADD_CHALLENGE_AMOUNT}" />
                        <input id="${ELEMENT_IDS.ADD_CHALLENGE_TIMER}" />
                        <div id="${ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR_GROUP}" class="${CSS_CLASSES.HIDDEN}">
                            <select id="${ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR}">
                                <option value="${TimerEndBehavior.AUTO_FAIL}">Auto Fail</option>
                                <option value="${TimerEndBehavior.AUTO_COMPLETE}">Auto Complete</option>
                            </select>
                        </div>
                        <button id="${ELEMENT_IDS.ADD_CHALLENGE_SUBMIT}" type="submit"></button>
                        <button id="${ELEMENT_IDS.ADD_CHALLENGE_CANCEL}" type="button"></button>
                    </form>
                </div>
            `
        );

        app = new App("timer-behavior-test");
        appPrivates = app as unknown as PrivateAppAccess;
        appPrivates.clearAddChallengeForm();
    });

    const getFormElements = () => {
        const titleInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TITLE
        ) as HTMLInputElement;
        const timerInput = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER
        ) as HTMLInputElement;
        const timerBehaviorSelect = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR
        ) as HTMLSelectElement;
        const timerBehaviorGroup = document.getElementById(
            ELEMENT_IDS.ADD_CHALLENGE_TIMER_BEHAVIOR_GROUP
        ) as HTMLElement;

        return {
            titleInput,
            timerInput,
            timerBehaviorSelect,
            timerBehaviorGroup,
        };
    };

    it("should omit timer end behavior when no timer is provided", () => {
        const { titleInput } = getFormElements();
        titleInput.value = "No timer challenge";

        const data = appPrivates.extractChallengeFormData();
        expect(data).not.toBeNull();
        expect(data?.timerEndBehavior).toBeUndefined();
    });

    it("should include timer end behavior when timer is provided", () => {
        const {
            titleInput,
            timerInput,
            timerBehaviorSelect,
            timerBehaviorGroup,
        } = getFormElements();
        titleInput.value = "Timer challenge";
        timerInput.value = "5m";
        timerBehaviorSelect.value = TimerEndBehavior.AUTO_COMPLETE;

        appPrivates.updateTimerBehaviorVisibility();

        const data = appPrivates.extractChallengeFormData();

        expect(data).not.toBeNull();
        expect(data?.timerEndBehavior).toBe(TimerEndBehavior.AUTO_COMPLETE);
        expect(timerBehaviorGroup.classList.contains(CSS_CLASSES.HIDDEN)).toBe(
            false
        );
    });

    it("should throw error for invalid timer behavior selection", () => {
        const { titleInput, timerInput, timerBehaviorSelect } =
            getFormElements();
        titleInput.value = "Timer challenge";
        timerInput.value = "5m";
        timerBehaviorSelect.value = "invalid-value";

        appPrivates.updateTimerBehaviorVisibility();

        expect(() => appPrivates.extractChallengeFormData()).toThrowError(
            ERROR_MESSAGES.TIMER_BEHAVIOR_INVALID
        );
        expect(timerBehaviorSelect.classList.contains(CSS_CLASSES.ERROR)).toBe(
            true
        );
    });

    it("should reset timer behavior state when clearing the form", () => {
        const { timerInput, timerBehaviorSelect, timerBehaviorGroup } =
            getFormElements();
        timerInput.value = "10m";
        timerBehaviorSelect.value = TimerEndBehavior.AUTO_COMPLETE;
        timerBehaviorGroup.classList.remove(CSS_CLASSES.HIDDEN);
        timerBehaviorSelect.classList.add(CSS_CLASSES.ERROR);

        appPrivates.clearAddChallengeForm();

        expect(timerInput.value).toBe("");
        expect(timerBehaviorSelect.value).toBe(TimerEndBehavior.AUTO_FAIL);
        expect(timerBehaviorSelect.classList.contains(CSS_CLASSES.ERROR)).toBe(
            false
        );
        expect(timerBehaviorGroup.classList.contains(CSS_CLASSES.HIDDEN)).toBe(
            true
        );
    });
});
