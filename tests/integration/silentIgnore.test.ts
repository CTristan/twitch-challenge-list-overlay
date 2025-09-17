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

describe("Silent Ignore Integration", () => {
    let app: App;
    let adminUser: TestUser;
    let modUser: TestUser;
    let regularUser: TestUser;

    beforeEach(() => {
        // Ensure test isolation
        ensureTestIsolation();

        // Create fresh app instance for each test
        app = createMockApp("SilentIgnoreTestStore");

        // Create test users
        adminUser = createAdminUser("TestAdmin");
        modUser = createModUser("TestMod");
        regularUser = createChatUser("TestUser");
    });

    describe("Silent Ignore Behavior", () => {
        it("should silently ignore all command types from regular users", () => {
            const commands = [
                "add Test Challenge",
                "edit 1 title='New Title'",
                "done 1",
                "delete 1",
                "list",
                "help",
                "check",
                "clearall",
                "cleardone",
                "+ 1",
                "- 1",
                "set 1 5",
                "fail 1",
                "show 1",
            ];

            commands.forEach((command) => {
                const response = executeCommand(
                    app,
                    regularUser,
                    "ch",
                    command
                );
                expectSilentIgnore(response);

                // Verify no challenges were created/modified
                expect(app.challengeList.challenges.length).toBe(0);
            });
        });

        it("should silently ignore empty commands from regular users", () => {
            const emptyCommands = ["", "   ", "\t", "\n", " \t \n "];

            emptyCommands.forEach((command) => {
                const response = executeCommand(
                    app,
                    regularUser,
                    "ch",
                    command
                );
                expectSilentIgnore(response);
            });
        });

        it("should silently ignore malformed commands from regular users", () => {
            const malformedCommands = [
                "invalidcommand",
                "add", // Missing parameters
                "edit", // Missing parameters
                "done", // Missing parameters
                "xyz abc def",
            ];

            malformedCommands.forEach((command) => {
                const response = executeCommand(
                    app,
                    regularUser,
                    "ch",
                    command
                );
                expectSilentIgnore(response);
            });
        });

        it("should process commands normally for authorized users", () => {
            // Test that moderators can still use commands
            const modResponse = executeCommand(
                app,
                modUser,
                "ch",
                "add Test Challenge"
            );
            expectSuccessResponse(modResponse);
            expect(app.challengeList.challenges.length).toBe(1);

            // Test that broadcasters can still use commands
            const adminResponse = executeCommand(app, adminUser, "ch", "list");
            expectSuccessResponse(adminResponse);
        });

        it("should maintain consistent behavior across user types", () => {
            const testCommand = "add Test Challenge";

            // Regular user gets silent ignore
            const regularResponse = executeCommand(
                app,
                regularUser,
                "ch",
                testCommand
            );
            expectSilentIgnore(regularResponse);
            expect(app.challengeList.challenges.length).toBe(0);

            // Moderator gets normal processing
            const modResponse = executeCommand(app, modUser, "ch", testCommand);
            expectSuccessResponse(modResponse);
            expect(app.challengeList.challenges.length).toBe(1);

            // Broadcaster gets normal processing
            const adminResponse = executeCommand(app, adminUser, "ch", "list");
            expectSuccessResponse(adminResponse);
        });
    });

    describe("Chat Flow Integration", () => {
        it("should demonstrate complete silent ignore flow", () => {
            // Simulate a regular user trying various commands
            const userAttempts = [
                "!ch add Unauthorized Challenge",
                "!ch list",
                "!ch help",
                "!ch",
                "!ch clearall",
            ];

            userAttempts.forEach((attempt) => {
                // Extract command and message parts
                const parts = attempt.split(" ");
                const command = parts[0]?.slice(1) ?? ""; // Remove ! safely
                const message = parts.slice(1).join(" ");

                const response = app.chatHandler(
                    regularUser.username,
                    command,
                    message,
                    regularUser.flags,
                    regularUser.extra
                );

                // All should be silently ignored
                expectSilentIgnore(response);
            });

            // Verify no state changes occurred
            expect(app.challengeList.challenges.length).toBe(0);
        });

        it("should show normal processing for authorized users", () => {
            // Moderator adds a challenge
            const addResponse = app.chatHandler(
                modUser.username,
                "ch",
                "add Test Challenge",
                modUser.flags,
                modUser.extra
            );

            expectSuccessResponse(addResponse);
            expect(app.challengeList.challenges.length).toBe(1);

            // Broadcaster lists challenges
            const listResponse = app.chatHandler(
                adminUser.username,
                "ch",
                "list",
                adminUser.flags,
                adminUser.extra
            );

            expectSuccessResponse(listResponse);
            expect(listResponse.message).toContain("Test Challenge");
        });
    });
});
