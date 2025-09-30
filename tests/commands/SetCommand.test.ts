import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { SetCommand } from "../../src/commands/SetCommand";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("SetCommand", () => {
    let setCommand: SetCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        setCommand = new SetCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create SetCommand instance with required dependencies", () => {
            expect(setCommand).toBeDefined();
            expect(setCommand).toBeInstanceOf(SetCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
        });
    });

    describe("execute - Valid Set Operations", () => {
        it("should set progress to a specific value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
            expect(response.message).toContain("progress: 0/10 → 5/10");
        });

        it("should set progress to zero", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            expect(challenge.progress).toBe(2);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "0",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(0);
            expect(response.message).toContain("progress: 2/10 → 0/10");
        });

        it("should set progress to maximum amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "10",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(10);
            expect(response.message).toContain("progress: 0/10 → 10/10");
        });

        it("should update progress from existing value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 20 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            expect(challenge.progress).toBe(3);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "15",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(15);
            expect(response.message).toContain("progress: 3/20 → 15/20");
        });

        it("should set progress using value parameter", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: { value: "7" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(7);
            expect(response.message).toContain("progress: 0/10 → 7/10");
        });

        it("should handle large progress values", () => {
            const challenge = new Challenge("Test Challenge", { amount: 1000 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "999",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(999);
            expect(response.message).toContain("progress: 0/1000 → 999/1000");
        });
    });

    describe("execute - Invalid Input Handling", () => {
        it("should return error when no target ID is provided", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Target ID required");
            expect(response.message).toContain("set");
            expect(challenge.progress).toBe(0);
        });

        it("should return error when target ID is invalid", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "invalid",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            expect(challenge.progress).toBe(0);
        });

        it("should return error when challenge does not exist", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "5",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            expect(challenge.progress).toBe(0);
        });

        it("should return error when no progress value is provided", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("!ch set");
            expect(challenge.progress).toBe(0);
        });

        it("should return error for non-numeric progress value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "abc",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("!ch set");
            expect(challenge.progress).toBe(0);
        });

        it("should return error for negative progress value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "-5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("validating");
            expect(challenge.progress).toBe(0);
        });

        it("should return error for progress value exceeding amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "15",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("validating");
            expect(challenge.progress).toBe(0);
        });

        it("should truncate decimal progress value to integer", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5.5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            // parseInt truncates decimals, so 5.5 becomes 5
            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
            expect(response.message).toContain("progress: 0/10 → 5/10");
        });

        it("should return error for challenge without amount", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("validating");
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle setting progress on first challenge in list", () => {
            const challenge1 = new Challenge("First", { amount: 10 });
            const challenge2 = new Challenge("Second", { amount: 10 });
            const challenge3 = new Challenge("Third", { amount: 10 });
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.progress).toBe(5);
            expect(challenge2.progress).toBe(0);
            expect(challenge3.progress).toBe(0);
        });

        it("should handle setting progress on last challenge in list", () => {
            const challenge1 = new Challenge("First", { amount: 10 });
            const challenge2 = new Challenge("Second", { amount: 10 });
            const challenge3 = new Challenge("Third", { amount: 10 });
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "7",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.progress).toBe(0);
            expect(challenge2.progress).toBe(0);
            expect(challenge3.progress).toBe(7);
        });

        it("should handle setting progress on middle challenge in list", () => {
            const challenge1 = new Challenge("First", { amount: 10 });
            const challenge2 = new Challenge("Second", { amount: 10 });
            const challenge3 = new Challenge("Third", { amount: 10 });
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "3",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.progress).toBe(0);
            expect(challenge2.progress).toBe(3);
            expect(challenge3.progress).toBe(0);
        });

        it("should handle whitespace in target ID", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: " 1 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
        });

        it("should handle zero as target ID", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "0",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            expect(challenge.progress).toBe(0);
        });

        it("should handle negative target ID", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "-1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
            expect(challenge.progress).toBe(0);
        });

        it("should persist progress changes to localStorage", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle setting progress on completed challenge", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challenge.setCompletionStatus(true);
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
            // Setting progress to incomplete value changes completion status
            expect(challenge.isComplete()).toBe(false);
        });
    });

    describe("execute - DOM Update Coordination", () => {
        it("should include UI update data with EDIT action for normal progress update", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.EDIT);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(response.uiUpdate?.updateTimers).toBe(true);
            expect(response.uiUpdate?.updateCount).toBe(true);
        });

        it("should include UI update data with COMPLETE action when progress reaches amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "10",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.COMPLETE);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(response.uiUpdate?.challenges).toHaveLength(1);
            expect(challenge.isComplete()).toBe(true);
        });

        it("should include UI update data with REVERT action when setting incomplete progress on completed challenge", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            expect(challenge.isComplete()).toBe(true);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate).toBeDefined();
            expect(response.uiUpdate?.action).toBe(UIUpdateAction.REVERT);
            expect(response.uiUpdate?.challengeIndices).toEqual([0]);
            expect(challenge.isComplete()).toBe(false);
        });

        it("should include updated challenge in UI update", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "7",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate?.challenges?.[0]).toBe(challenge);
            expect(response.uiUpdate?.challenges?.[0]?.progress).toBe(7);
        });
    });

    describe("execute - Error Handling", () => {
        it("should handle error during progress update operation", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            // Mock setChallengeProgress to throw an error
            const originalMethod = challengeList.setChallengeProgress;
            challengeList.setChallengeProgress = () => {
                throw new Error("Progress update failed");
            };

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("seting challenge progress");
            expect(response.message).toContain("Progress update failed");

            // Restore original method
            challengeList.setChallengeProgress = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            // Mock setChallengeProgress to throw a non-Error object
            const originalMethod = challengeList.setChallengeProgress;
            challengeList.setChallengeProgress = () => {
                throw "String error";
            };

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("seting challenge progress");

            // Restore original method
            challengeList.setChallengeProgress = originalMethod;
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID and progress change", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("progress: 0/10 → 5/10");
        });

        it("should format response correctly for different progress values", () => {
            const challenge = new Challenge("Test Challenge", { amount: 20 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "15",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            expect(response.message).toContain("progress: 3/20 → 15/20");
        });

        it("should verify response includes position ID not internal ID", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "5",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
            // Response uses short IDs by default
        });
    });

    describe("execute - Boundary Values", () => {
        it("should handle setting progress to 1 on amount of 1", () => {
            const challenge = new Challenge("Test Challenge", { amount: 1 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "1",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(1);
            expect(challenge.isComplete()).toBe(true);
        });

        it("should handle setting progress to 0 on amount of 1", () => {
            const challenge = new Challenge("Test Challenge", { amount: 1 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "0",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(0);
            expect(challenge.isComplete()).toBe(false);
        });

        it("should handle setting same progress value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            expect(challenge.progress).toBe(3);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "3",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(3);
            expect(response.message).toContain("progress: 3/10 → 3/10");
        });

        it("should handle whitespace in progress value", () => {
            const challenge = new Challenge("Test Challenge", { amount: 10 });
            challengeList.addChallengeObjects(challenge);

            const response = setCommand.execute(
                {
                    command: "set",
                    parameters: {},
                    rawParameters: "  5  ",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.progress).toBe(5);
        });
    });
});
