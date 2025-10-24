import { beforeEach, describe, expect, it } from "vitest";
import Challenge from "../../src/classes/Challenge";
import ChallengeList from "../../src/classes/ChallengeList";
import ConfigManager from "../../src/classes/ConfigManager";
import { EditCommand } from "../../src/commands/EditCommand";
import { ChallengeStatus } from "../../src/types/ChallengeStatus";
import { UIUpdateAction } from "../../src/types/UIUpdateAction";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

describe("EditCommand", () => {
    let editCommand: EditCommand;
    let challengeList: ChallengeList;
    let configManager: ConfigManager;

    beforeEach(() => {
        // Clear localStorage for test isolation
        ensureTestIsolation();
        challengeList = new ChallengeList();
        configManager = ConfigManager.getInstance();
        editCommand = new EditCommand(challengeList, configManager);
    });

    describe("Constructor and Initialization", () => {
        it("should create EditCommand instance with required dependencies", () => {
            expect(editCommand).toBeDefined();
            expect(editCommand).toBeInstanceOf(EditCommand);
        });

        it("should have access to challengeList", () => {
            // Add a challenge to verify access
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Updated Title");
        });
    });

    describe("execute - Title Updates", () => {
        it("should update challenge title", () => {
            const challenge = new Challenge("Original Title");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("New Title");
            expect(response.message).toContain("#1");
            expect(response.message).toContain("updated");
        });

        it("should return error for title that is too long", () => {
            const challenge = new Challenge("Original Title");
            challengeList.addChallengeObjects(challenge);

            const longTitle = "A".repeat(101);
            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: `"${longTitle}"` },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating title");
            expect(challenge.title).toBe("Original Title");
        });

        it("should return error for empty title", () => {
            const challenge = new Challenge("Original Title");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '""' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating title");
            expect(challenge.title).toBe("Original Title");
        });

        it("should handle whitespace-only title", () => {
            const challenge = new Challenge("Original Title");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"   "' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating title");
            expect(challenge.title).toBe("Original Title");
        });
    });

    describe("execute - Description Updates", () => {
        it("should update challenge description", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Original Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { desc: '"New Description"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.description).toBe("New Description");
        });

        it("should allow empty description", () => {
            const challenge = new Challenge("Test Challenge", {
                description: "Original Description",
            });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { desc: '""' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.description).toBe("");
        });

        it("should return error for description that is too long", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const longDesc = "A".repeat(201);
            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { desc: `"${longDesc}"` },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating description");
        });
    });

    describe("execute - Amount Updates", () => {
        it("should update challenge amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { amount: "10" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.amount).toBe(10);
        });

        it("should return error for invalid amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { amount: "invalid" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating amount");
            expect(challenge.amount).toBe(5);
        });

        it("should return error for negative amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { amount: "-5" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating amount");
            expect(challenge.amount).toBe(5);
        });

        it("should return error for zero amount", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { amount: "0" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating amount");
            expect(challenge.amount).toBe(5);
        });
    });

    describe("execute - Timer Updates", () => {
        it("should add timer to challenge without timer", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            expect(challenge.timer).toBeUndefined();

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "10m" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.timer).toBeDefined();
            expect(challenge.timer?.duration).toBe(600);
        });

        it("should update existing timer", () => {
            const challenge = new Challenge("Test Challenge", { timer: "5m" });
            challengeList.addChallengeObjects(challenge);

            expect(challenge.timer?.duration).toBe(300);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "15m" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.timer?.duration).toBe(900);
        });

        it("should return error for invalid timer format", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "invalid" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating timer");
            expect(challenge.timer).toBeUndefined();
        });

        it("should handle various timer formats", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Test seconds format
            let response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "90s" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.timer?.duration).toBe(90);

            // Test clock format
            response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "12:30" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.timer?.duration).toBe(750);
        });
    });

    describe("execute - Multiple Parameter Updates", () => {
        it("should update multiple parameters at once", () => {
            const challenge = new Challenge("Original Title", {
                description: "Original Description",
                amount: 5,
            });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: {
                        title: '"New Title"',
                        desc: '"New Description"',
                        amount: "10",
                        timer: "15m",
                    },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("New Title");
            expect(challenge.description).toBe("New Description");
            expect(challenge.amount).toBe(10);
            expect(challenge.timer).toBeDefined();
            expect(challenge.timer?.duration).toBe(900);
        });

        it("should update only title and description", () => {
            const challenge = new Challenge("Original Title", {
                description: "Original Description",
                amount: 5,
            });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: {
                        title: '"New Title"',
                        desc: '"New Description"',
                    },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("New Title");
            expect(challenge.description).toBe("New Description");
            expect(challenge.amount).toBe(5); // Unchanged
        });

        it("should update only amount and timer", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: {
                        amount: "10",
                        timer: "20m",
                    },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Test Challenge"); // Unchanged
            expect(challenge.amount).toBe(10);
            expect(challenge.timer?.duration).toBe(1200);
        });
    });

    describe("execute - Error Handling", () => {
        it("should return error when no target ID is provided", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("Target ID required");
            expect(response.message).toContain("edit");
        });

        it("should return error when target ID is invalid", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "invalid",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should return error when challenge does not exist", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "5",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should return error when no valid parameters provided", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: {},
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("No valid parameters provided");
            expect(response.message).toContain("title, desc, amount, or timer");
        });

        it("should handle error during title update", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setTitle to throw an error
            const originalMethod = challenge.setTitle;
            challenge.setTitle = () => {
                throw new Error("Title update failed");
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating title");
            expect(response.message).toContain("Title update failed");

            // Restore original method
            challenge.setTitle = originalMethod;
        });

        it("should handle error during description update", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setDescription to throw an error
            const originalMethod = challenge.setDescription;
            challenge.setDescription = () => {
                throw new Error("Description update failed");
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { desc: '"New Description"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating description");
            expect(response.message).toContain("Description update failed");

            // Restore original method
            challenge.setDescription = originalMethod;
        });

        it("should handle error during amount update", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setAmount to throw an error
            const originalMethod = challenge.setAmount;
            challenge.setAmount = () => {
                throw new Error("Amount update failed");
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { amount: "10" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating amount");
            expect(response.message).toContain("Amount update failed");

            // Restore original method
            challenge.setAmount = originalMethod;
        });

        it("should handle error during timer update", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setTimer to throw an error
            const originalMethod = challenge.setTimer;
            challenge.setTimer = () => {
                throw new Error("Timer update failed");
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { timer: "10m" },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating timer");
            expect(response.message).toContain("Timer update failed");

            // Restore original method
            challenge.setTimer = originalMethod;
        });

        it("should handle non-Error exceptions", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock setTitle to throw a non-Error object
            const originalMethod = challenge.setTitle;
            challenge.setTitle = () => {
                throw "String error";
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("updating title");

            // Restore original method
            challenge.setTitle = originalMethod;
        });

        it("should handle unexpected errors in try-catch", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            // Mock handleSingleTarget to throw an error
            const originalMethod = (editCommand as any).handleSingleTarget;
            (editCommand as any).handleSingleTarget = () => {
                throw new Error("Unexpected error");
            };

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("editing challenge");
            expect(response.message).toContain("Unexpected error");

            // Restore original method
            (editCommand as any).handleSingleTarget = originalMethod;
        });
    });

    describe("execute - UI Update Data", () => {
        it("should include UI update data with EDIT action", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
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

        it("should include updated challenge in UI update", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.uiUpdate?.challenges?.[0]).toBe(challenge);
            expect(response.uiUpdate?.challenges?.[0]?.title).toBe(
                "Updated Title"
            );
        });
    });

    describe("execute - Edge Cases", () => {
        it("should handle editing first challenge in list", () => {
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated First"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.title).toBe("Updated First");
            expect(challenge2.title).toBe("Second");
            expect(challenge3.title).toBe("Third");
        });

        it("should handle editing last challenge in list", () => {
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Third"' },
                    rawParameters: "",
                    targetId: "3",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.title).toBe("First");
            expect(challenge2.title).toBe("Second");
            expect(challenge3.title).toBe("Updated Third");
        });

        it("should handle editing middle challenge in list", () => {
            const challenge1 = new Challenge("First");
            const challenge2 = new Challenge("Second");
            const challenge3 = new Challenge("Third");
            challengeList.addChallengeObjects([
                challenge1,
                challenge2,
                challenge3,
            ]);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Second"' },
                    rawParameters: "",
                    targetId: "2",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge1.title).toBe("First");
            expect(challenge2.title).toBe("Updated Second");
            expect(challenge3.title).toBe("Third");
        });

        it("should handle whitespace in target ID", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: " 1 ",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Updated Title");
        });

        it("should handle zero as target ID", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "0",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should handle negative target ID", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "-1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(true);
            expect(response.message).toContain("not found");
        });

        it("should persist edits to localStorage", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Updated Title");
            // Note: ChallengeList automatically persists to localStorage
            // The persistence is tested in ChallengeList tests
        });

        it("should handle editing challenge with progress", () => {
            const challenge = new Challenge("Test Challenge", { amount: 5 });
            challenge.incrementProgress();
            challenge.incrementProgress();
            challengeList.addChallengeObjects(challenge);

            expect(challenge.progress).toBe(2);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Updated Title");
            expect(challenge.progress).toBe(2); // Progress unchanged
        });

        it("should handle editing completed challenge", () => {
            const challenge = new Challenge("Test Challenge");
            challenge.setStatus(ChallengeStatus.COMPLETED);
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Updated Title");
            expect(challenge.isComplete()).toBe(true); // Completion status unchanged
        });
    });

    describe("execute - Response Formatting", () => {
        it("should format response with short ID", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("#1");
        });

        it("should format response with update confirmation", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"New Title"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("updated");
            expect(challenge.title).toBe("New Title");
        });

        it("should verify response includes position ID not internal ID", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Updated Title"' },
                    rawParameters: "",
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

    describe("execute - Special Character Handling", () => {
        it("should handle special characters in title", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Title with @#$%"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Title with @#$%");
        });

        it("should handle special characters in description", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { desc: '"Description with @#$%"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.description).toBe("Description with @#$%");
        });

        it("should handle unicode characters in title", () => {
            const challenge = new Challenge("Test Challenge");
            challengeList.addChallengeObjects(challenge);

            const response = editCommand.execute(
                {
                    command: "edit",
                    parameters: { title: '"Title with 🎮 emoji"' },
                    rawParameters: "",
                    targetId: "1",
                    isValid: true,
                    errors: [],
                },
                "testuser"
            );

            expect(response.error).toBe(false);
            expect(challenge.title).toBe("Title with 🎮 emoji");
        });
    });
});
