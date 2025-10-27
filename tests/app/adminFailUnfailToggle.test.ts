import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { BEHAVIOR_CONFIG } from "../../src/types/ConfigConstants";
import {
    CSS_CLASSES,
    CSS_SELECTORS,
    EVENT_NAMES,
    URL_HASH,
} from "../../src/types/DOMConstants";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("Admin fail/unfail controls across render modes", () => {
    let app: App;

    beforeEach(() => {
        ensureTestIsolation();

        document.body.innerHTML = `
            <main id="app">
                <div class="challenge-wrapper">
                    <div class="challenge-container"></div>
                </div>
            </main>
        `;

        app = new App("testChallengeList");
        app.getConfigManager().reset();
        window.location.hash = URL_HASH.ADMIN;
    });

    it("should retain fail/unfail actions when switching from text-only to standard mode", () => {
        app.challengeList.addChallenges([
            "First Challenge",
            "Second Challenge",
        ]);

        const challenges = app.challengeList.getAllChallenges();
        const firstChallenge = challenges[0];
        const secondChallenge = challenges[1];

        if (!firstChallenge || !secondChallenge) {
            throw new Error("Expected seeded challenges for fail/unfail test");
        }

        const configManager = app.getConfigManager();
        configManager.set(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE, true);
        app.renderChallengeList();

        app.challengeList.markChallengeAsFailed(firstChallenge.id);
        app.renderChallengeList();

        configManager.set(BEHAVIOR_CONFIG.ADMIN_TEXT_ONLY_MODE, false);
        app.renderChallengeList();

        const failedElement = document.querySelector(
            CSS_SELECTORS.CHALLENGE_BY_ID(firstChallenge.id)
        ) as HTMLElement | null;
        expect(failedElement).toBeTruthy();

        const unfailButton = failedElement?.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL}`
        ) as HTMLElement | null;
        expect(unfailButton).toBeTruthy();

        const activeElement = document.querySelector(
            CSS_SELECTORS.CHALLENGE_BY_ID(secondChallenge.id)
        ) as HTMLElement | null;
        expect(activeElement).toBeTruthy();

        const failButton = activeElement?.querySelector(
            `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_FAIL}`
        ) as HTMLElement | null;
        expect(failButton).toBeTruthy();

        failButton?.dispatchEvent(
            new Event(EVENT_NAMES.CLICK, { bubbles: true })
        );

        const challengeFromList = app.challengeList.getChallengeById(
            secondChallenge.id
        );
        expect(challengeFromList?.getStatus()).toBe(ChallengeStatus.FAILED);

        const refreshedActiveElement = document.querySelector(
            CSS_SELECTORS.CHALLENGE_BY_ID(secondChallenge.id)
        ) as HTMLElement | null;
        expect(
            refreshedActiveElement?.querySelector(
                `.${CSS_CLASSES.CHALLENGE_TEXT_ONLY_UNFAIL}`
            )
        ).toBeTruthy();
    });
});
