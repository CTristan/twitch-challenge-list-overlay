import { beforeEach, describe, expect, it, vi } from "vitest";
import Challenge from "../../src/classes/Challenge";
import { ResponseFormatter } from "../../src/utils/ResponseFormatter";

// Mock PositionUtils
vi.mock("../../src/utils/PositionUtils", () => ({
    formatDisplayPosition: vi.fn((index: number) => (index + 1).toString()),
}));

describe("ResponseFormatter", () => {
    let mockChallenge: Challenge;
    let mockChallengeWithTimer: Challenge;
    let mockCompletedChallenge: Challenge;

    beforeEach(() => {
        // Create mock challenges with required methods
        mockChallenge = {
            title: "Test Challenge",
            amount: 5,
            progress: 2,
            timer: null,
            getProgressString: vi.fn(() => "2/5"),
            getTimerString: vi.fn(() => ""),
            getStatusEmoji: vi.fn(() => "📝"),
            isComplete: vi.fn(() => false),
        } as any;

        mockChallengeWithTimer = {
            title: "Timer Challenge",
            amount: 3,
            progress: 1,
            timer: { isActive: true },
            getProgressString: vi.fn(() => "1/3"),
            getTimerString: vi.fn(() => "5:30"),
            getStatusEmoji: vi.fn(() => "⏱️"),
            isComplete: vi.fn(() => false),
        } as any;

        mockCompletedChallenge = {
            title: "Completed Challenge",
            amount: 1,
            progress: 1,
            timer: null,
            getProgressString: vi.fn(() => "1/1"),
            getTimerString: vi.fn(() => ""),
            getStatusEmoji: vi.fn(() => "✅"),
            isComplete: vi.fn(() => true),
        } as any;
    });

    describe("formatAddResponse", () => {
        it("should format add response with all default options", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallenge,
                0
            );
            expect(result).toBe("[#1] Test Challenge — 2/5 📝 added!");
        });

        it("should format add response with timer", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallengeWithTimer,
                1
            );
            expect(result).toBe(
                "[#2] Timer Challenge — 1/3 • 5:30 timer started ⏱️ added!"
            );
        });

        it("should format add response without emoji", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallenge,
                0,
                { includeEmoji: false }
            );
            expect(result).toBe("[#1] Test Challenge — 2/5 added!");
        });

        it("should format add response without progress", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallenge,
                0,
                { includeProgress: false }
            );
            expect(result).toBe("[#1] Test Challenge 📝 added!");
        });

        it("should format add response without timer info", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallengeWithTimer,
                0,
                { includeTimer: false }
            );
            expect(result).toBe("[#1] Timer Challenge — 1/3 ⏱️ added!");
        });

        it("should format add response without short ID", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallenge,
                0,
                { includeShortId: false }
            );
            expect(result).toBe("Test Challenge — 2/5 📝 added!");
        });

        it("should handle challenge without timer", () => {
            const result = ResponseFormatter.formatAddResponse(
                mockChallenge,
                0
            );
            expect(result).not.toContain("timer started");
        });
    });

    describe("formatCompleteResponse", () => {
        it("should return error message for empty challenges array", () => {
            const result = ResponseFormatter.formatCompleteResponse([], []);
            expect(result).toBe("No challenges were completed.");
        });

        it("should format single challenge completion with short ID", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Good job on completing challenge #1 ✅!");
        });

        it("should format single challenge completion without short ID", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge],
                [0],
                { includeShortId: false }
            );
            expect(result).toBe('Good job on completing "Test Challenge" ✅!');
        });

        it("should format single challenge completion without emoji", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge],
                [0],
                { includeEmoji: false }
            );
            expect(result).toBe("Good job on completing challenge #1!");
        });

        it("should handle missing challenge in single completion", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [null as any],
                [0]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should handle undefined index in single completion", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge],
                [undefined as any]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should format multiple challenge completion with short IDs", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1]
            );
            expect(result).toBe("Good job on completing challenges #1, #2 ✅!");
        });

        it("should format multiple challenge completion without short IDs", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1],
                { includeShortId: false }
            );
            expect(result).toBe(
                'Good job on completing challenges "Test Challenge", "Timer Challenge" ✅!'
            );
        });

        it("should format multiple challenge completion without emoji", () => {
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1],
                { includeEmoji: false }
            );
            expect(result).toBe("Good job on completing challenges #1, #2!");
        });

        it("should handle index mismatch in multiple completion", () => {
            // This should not throw an error but handle gracefully
            const result = ResponseFormatter.formatCompleteResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Good job on completing challenge #1 ✅!");
        });
    });

    describe("formatEditResponse", () => {
        it("should format edit response with short ID", () => {
            const result = ResponseFormatter.formatEditResponse(
                mockChallenge,
                0
            );
            expect(result).toBe("Challenge #1 updated!");
        });

        it("should format edit response without short ID", () => {
            const result = ResponseFormatter.formatEditResponse(
                mockChallenge,
                0,
                { includeShortId: false }
            );
            expect(result).toBe('Challenge "Test Challenge" updated!');
        });
    });

    describe("formatDeleteResponse", () => {
        it("should return error message for empty challenges array", () => {
            const result = ResponseFormatter.formatDeleteResponse([], []);
            expect(result).toBe("No challenges were deleted.");
        });

        it("should format single challenge deletion", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 has been deleted!");
        });

        it("should format single challenge deletion without short ID", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge],
                [0],
                { includeShortId: false }
            );
            expect(result).toBe('Challenge "Test Challenge" has been deleted!');
        });

        it("should handle missing challenge in single deletion", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [null as any],
                [0]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should handle undefined index in single deletion", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge],
                [undefined as any]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should format multiple challenge deletion", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1]
            );
            expect(result).toBe("Challenges #1, #2 have been deleted!");
        });

        it("should format multiple challenge deletion without short IDs", () => {
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1],
                { includeShortId: false }
            );
            expect(result).toBe(
                'Challenges "Test Challenge", "Timer Challenge" have been deleted!'
            );
        });

        it("should handle index mismatch in multiple deletion", () => {
            // This should not throw an error but handle gracefully
            const result = ResponseFormatter.formatDeleteResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 has been deleted!");
        });
    });

    describe("formatFailResponse", () => {
        it("should return error message for empty challenges array", () => {
            const result = ResponseFormatter.formatFailResponse([], []);
            expect(result).toBe("No challenges were marked as failed.");
        });

        it("should format single challenge failure", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 marked as failed ❌");
        });

        it("should format single challenge failure without emoji", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge],
                [0],
                { includeEmoji: false }
            );
            expect(result).toBe("Challenge #1 marked as failed");
        });

        it("should format single challenge failure without short ID", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge],
                [0],
                { includeShortId: false }
            );
            expect(result).toBe(
                'Challenge "Test Challenge" marked as failed ❌'
            );
        });

        it("should handle missing challenge in single failure", () => {
            const result = ResponseFormatter.formatFailResponse(
                [null as any],
                [0]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should handle undefined index in single failure", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge],
                [undefined as any]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should format multiple challenge failure", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1]
            );
            expect(result).toBe("Challenges #1, #2 marked as failed ❌");
        });

        it("should format multiple challenge failure without emoji", () => {
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1],
                { includeEmoji: false }
            );
            expect(result).toBe("Challenges #1, #2 marked as failed");
        });

        it("should handle index mismatch in multiple failure", () => {
            // This should not throw an error but handle gracefully
            const result = ResponseFormatter.formatFailResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 marked as failed ❌");
        });
    });

    describe("formatUndoneResponse", () => {
        it("should return error message for empty challenges array", () => {
            const result = ResponseFormatter.formatUndoneResponse([], []);
            expect(result).toBe("No challenges were reverted.");
        });

        it("should format single challenge undone", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 reverted to active status 🔄!");
        });

        it("should format single challenge undone without emoji", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge],
                [0],
                { includeEmoji: false }
            );
            expect(result).toBe("Challenge #1 reverted to active status!");
        });

        it("should format single challenge undone without short ID", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge],
                [0],
                { includeShortId: false }
            );
            expect(result).toBe(
                'Challenge "Test Challenge" reverted to active status 🔄!'
            );
        });

        it("should handle missing challenge in single undone", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [null as any],
                [0]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should handle undefined index in single undone", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge],
                [undefined as any]
            );
            expect(result).toBe("Error: Challenge not found");
        });

        it("should format multiple challenge undone", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1]
            );
            expect(result).toBe(
                "Challenges #1, #2 reverted to active status 🔄!"
            );
        });

        it("should format multiple challenge undone without emoji", () => {
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge, mockChallengeWithTimer],
                [0, 1],
                { includeEmoji: false }
            );
            expect(result).toBe("Challenges #1, #2 reverted to active status!");
        });

        it("should handle index mismatch in multiple undone", () => {
            // This should not throw an error but handle gracefully
            const result = ResponseFormatter.formatUndoneResponse(
                [mockChallenge],
                [0]
            );
            expect(result).toBe("Challenge #1 reverted to active status 🔄!");
        });
    });

    describe("formatProgressResponse", () => {
        it("should format progress response with short ID and progress", () => {
            const result = ResponseFormatter.formatProgressResponse(
                mockChallenge,
                0,
                1
            );
            expect(result).toBe("Challenge #1 progress: 1/5 → 2/5");
        });

        it("should format progress response without short ID", () => {
            const result = ResponseFormatter.formatProgressResponse(
                mockChallenge,
                0,
                1,
                { includeShortId: false }
            );
            expect(result).toBe(
                'Challenge "Test Challenge" progress: 1/5 → 2/5'
            );
        });

        it("should format progress response without progress display", () => {
            const result = ResponseFormatter.formatProgressResponse(
                mockChallenge,
                0,
                1,
                { includeProgress: false }
            );
            expect(result).toBe("Challenge #1 progress updated");
        });

        it("should include completion indicator when challenge becomes complete", () => {
            mockCompletedChallenge.isComplete = vi.fn(() => true);
            const result = ResponseFormatter.formatProgressResponse(
                mockCompletedChallenge,
                0,
                0
            );
            expect(result).toBe(
                "Challenge #1 progress: 0/1 → 1/1 ✅ Completed!"
            );
        });

        it("should not include completion indicator when already complete", () => {
            mockCompletedChallenge.isComplete = vi.fn(() => true);
            const result = ResponseFormatter.formatProgressResponse(
                mockCompletedChallenge,
                0,
                1
            );
            expect(result).toBe("Challenge #1 progress: 1/1 → 1/1");
        });
    });

    describe("formatChallengeList", () => {
        it("should return error message for empty challenges array", () => {
            const result = ResponseFormatter.formatChallengeList([]);
            expect(result).toBe("No challenges found");
        });

        it("should format single challenge with all default options", () => {
            const result = ResponseFormatter.formatChallengeList([
                mockChallenge,
            ]);
            expect(result).toBe("#1 Test Challenge (2/5) 📝");
        });

        it("should format multiple challenges", () => {
            const result = ResponseFormatter.formatChallengeList([
                mockChallenge,
                mockChallengeWithTimer,
            ]);
            expect(result).toBe(
                "#1 Test Challenge (2/5) 📝, #2 Timer Challenge (1/3) ⏱️"
            );
        });

        it("should format challenges without emoji", () => {
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                { includeEmoji: false }
            );
            expect(result).toBe("#1 Test Challenge (2/5)");
        });

        it("should format challenges without progress", () => {
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                { includeProgress: false }
            );
            expect(result).toBe("#1 Test Challenge 📝");
        });

        it("should format challenges without short ID", () => {
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                { includeShortId: false }
            );
            expect(result).toBe("Test Challenge (2/5) 📝");
        });

        it("should include timer display when enabled and timer is active", () => {
            const result = ResponseFormatter.formatChallengeList(
                [mockChallengeWithTimer],
                { includeTimer: true }
            );
            expect(result).toBe("#1 Timer Challenge (1/3) [5:30] ⏱️");
        });

        it("should not include timer display when timer is inactive", () => {
            mockChallenge.timer = { isActive: false } as any;
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                { includeTimer: true }
            );
            expect(result).toBe("#1 Test Challenge (2/5) 📝");
        });

        it("should use provided indices for position numbering", () => {
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                {},
                [5]
            );
            expect(result).toBe("#6 Test Challenge (2/5) 📝");
        });

        it("should handle index mismatch when using provided indices", () => {
            // This should not throw an error but handle gracefully
            const result = ResponseFormatter.formatChallengeList(
                [mockChallenge],
                {},
                [0]
            );
            expect(result).toBe("#1 Test Challenge (2/5) 📝");
        });

        it("should truncate result when exceeding maxLength", () => {
            const longChallenge = {
                ...mockChallenge,
                title: "Very Long Challenge Title That Exceeds Limit",
            } as any;
            const result = ResponseFormatter.formatChallengeList(
                [longChallenge],
                { maxLength: 20 }
            );
            expect(result).toBe("#1 Very Long Chal...");
            expect(result.length).toBe(20);
        });
    });

    describe("formatHelp", () => {
        it("should return general help when no commands provided", () => {
            const result = ResponseFormatter.formatHelp();
            expect(result).toBe(
                "Available commands: !ch add, !ch edit, !ch done, !ch undone, !ch delete, !ch list, !ch clearall, !ch cleardone, !ch help"
            );
        });

        it("should return general help when empty commands array provided", () => {
            const result = ResponseFormatter.formatHelp([]);
            expect(result).toBe(
                "Available commands: !ch add, !ch edit, !ch done, !ch undone, !ch delete, !ch list, !ch clearall, !ch cleardone, !ch help"
            );
        });

        it("should format custom commands list", () => {
            const commands = ["add", "edit", "delete"];
            const result = ResponseFormatter.formatHelp(commands);
            expect(result).toBe("Available commands: add, edit, delete");
        });
    });

    describe("formatClearResponse", () => {
        it("should format clear all response without count", () => {
            const result = ResponseFormatter.formatClearResponse("all");
            expect(result).toBe("All challenges have been cleared");
        });

        it("should format clear all response with count", () => {
            const result = ResponseFormatter.formatClearResponse("all", 5);
            expect(result).toBe("All 5 challenges have been cleared");
        });

        it("should format clear done response without count", () => {
            const result = ResponseFormatter.formatClearResponse("done");
            expect(result).toBe("All completed challenges have been cleared");
        });

        it("should format clear done response with count", () => {
            const result = ResponseFormatter.formatClearResponse("done", 3);
            expect(result).toBe("All 3 completed challenges have been cleared");
        });
    });

    describe("formatValidationError", () => {
        it("should return generic error for empty errors array", () => {
            const result = ResponseFormatter.formatValidationError([]);
            expect(result).toBe("Invalid command format");
        });

        it("should format single validation error", () => {
            const result = ResponseFormatter.formatValidationError([
                "Title is required",
            ]);
            expect(result).toBe("Invalid command: Title is required");
        });

        it("should format multiple validation errors", () => {
            const result = ResponseFormatter.formatValidationError([
                "Title is required",
                "Amount must be positive",
            ]);
            expect(result).toBe(
                "Invalid command: Title is required, Amount must be positive"
            );
        });

        it("should handle empty string in errors array", () => {
            const result = ResponseFormatter.formatValidationError([""]);
            expect(result).toBe("Invalid command: ");
        });
    });

    describe("formatPermissionError", () => {
        it("should return permission error message", () => {
            const result = ResponseFormatter.formatPermissionError();
            expect(result).toBe(
                "Only moderators and the broadcaster can manage challenges"
            );
        });
    });

    describe("formatNotFoundError", () => {
        it("should format not found error with type and identifier", () => {
            const result = ResponseFormatter.formatNotFoundError(
                "challenge",
                "5"
            );
            expect(result).toBe("challenge 5 not found");
        });

        it("should handle empty type and identifier", () => {
            const result = ResponseFormatter.formatNotFoundError("", "");
            expect(result).toBe("  not found");
        });
    });

    describe("formatLimitError", () => {
        it("should format limit error with number", () => {
            const result = ResponseFormatter.formatLimitError(10);
            expect(result).toBe(
                "Maximum number of challenges reached (10). Delete some challenges first."
            );
        });

        it("should handle zero limit", () => {
            const result = ResponseFormatter.formatLimitError(0);
            expect(result).toBe(
                "Maximum number of challenges reached (0). Delete some challenges first."
            );
        });
    });
});
