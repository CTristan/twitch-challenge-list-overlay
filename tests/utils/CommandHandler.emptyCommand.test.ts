import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import {
    createAdminUser,
    createChatUser,
    createMockApp,
    createModUser,
    ensureTestIsolation,
    executeCommand,
    expectSilentIgnore,
    expectSuccessResponse,
    type TestUser,
} from "../utils/chatHandlerTestUtils";

describe("CommandHandler - Empty Command Behavior", () => {
    let app: App;
    let adminUser: TestUser;
    let modUser: TestUser;
    let regularUser: TestUser;

    beforeEach(() => {
        // Ensure test isolation
        ensureTestIsolation();

        // Create fresh app instance for each test
        app = createMockApp("EmptyCommandTestStore");

        // Create test users
        adminUser = createAdminUser("TestAdmin");
        modUser = createModUser("TestMod");
        regularUser = createChatUser("TestUser");
    });

    describe("Empty Command Default to Help", () => {
        it("should show help when moderator types just '!ch'", () => {
            const response = executeCommand(app, modUser, "ch", "");

            expectSuccessResponse(response, [
                "Available commands:",
                "!ch add",
                "!ch edit",
                "!ch done",
                "!ch delete",
                "!ch list",
                "!ch help",
            ]);
        });

        it("should show help when broadcaster types just '!ch'", () => {
            const response = executeCommand(app, adminUser, "ch", "");

            expectSuccessResponse(response, [
                "Available commands:",
                "!ch add",
                "!ch edit",
                "!ch done",
                "!ch delete",
                "!ch list",
                "!ch help",
            ]);
        });

        it("should silently ignore when regular user types just '!ch'", () => {
            const response = executeCommand(app, regularUser, "ch", "");

            expectSilentIgnore(response);
        });
    });

    describe("Whitespace-only Command Handling", () => {
        it("should show help when moderator types '!ch' with only whitespace", () => {
            const response = executeCommand(app, modUser, "ch", "   ");

            expectSuccessResponse(response, [
                "Available commands:",
                "!ch help",
            ]);
        });

        it("should show help when broadcaster types '!ch' with tabs and spaces", () => {
            const response = executeCommand(app, adminUser, "ch", "\t  \n  ");

            expectSuccessResponse(response, [
                "Available commands:",
                "!ch help",
            ]);
        });

        it("should silently ignore when regular user types '!ch' with whitespace", () => {
            const response = executeCommand(app, regularUser, "ch", "  \t  ");

            expectSilentIgnore(response);
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty string message parameter", () => {
            const response = executeCommand(app, modUser, "ch", "");

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });

        it("should handle null-like empty message", () => {
            // Test with undefined converted to empty string
            const response = app.chatHandler(
                modUser.username,
                "ch",
                "",
                modUser.flags,
                modUser.extra
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });

    describe("Comparison with Explicit Help Command", () => {
        it("should return same help content for empty command and explicit help", () => {
            const emptyResponse = executeCommand(app, modUser, "ch", "");
            const helpResponse = executeCommand(app, modUser, "ch", "help");

            expect(emptyResponse.error).toBe(false);
            expect(helpResponse.error).toBe(false);
            expect(emptyResponse.message).toBe(helpResponse.message);
        });

        it("should maintain consistent help format across both methods", () => {
            const emptyResponse = executeCommand(app, adminUser, "ch", "");
            const helpResponse = executeCommand(app, adminUser, "ch", "help");

            // Both should contain the same help content
            expect(emptyResponse.message).toContain("Available commands:");
            expect(helpResponse.message).toContain("Available commands:");
            expect(emptyResponse.message).toBe(helpResponse.message);
        });
    });

    describe("Add Command Usage Message", () => {
        it("should show usage message when moderator types '!ch add' with no arguments", () => {
            const response = executeCommand(app, modUser, "ch", "add");

            expect(response.error).toBe(false);
            expect(response.message).toContain("!ch add");
            expect(response.message).toContain("title=");
            expect(response.message).toContain("desc=");
            expect(response.message).toContain("amount=");
            expect(response.message).toContain("timer=");
            expect(response.message).toContain(
                "Add a new challenge with optional parameters"
            );
        });

        it("should show usage message when broadcaster types '!ch add' with no arguments", () => {
            const response = executeCommand(app, adminUser, "ch", "add");

            expect(response.error).toBe(false);
            expect(response.message).toContain("!ch add");
            expect(response.message).toContain(
                "Add a new challenge with optional parameters"
            );
        });

        it("should show usage message when '!ch add' has only whitespace", () => {
            const response = executeCommand(app, modUser, "ch", "add   ");

            expect(response.error).toBe(false);
            expect(response.message).toContain("!ch add");
            expect(response.message).toContain(
                "Add a new challenge with optional parameters"
            );
        });

        it("should silently ignore when regular user types '!ch add' with no arguments", () => {
            const response = executeCommand(app, regularUser, "ch", "add");

            expectSilentIgnore(response);
        });
    });
});
