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
    type TestUser,
} from "../utils/chatHandlerTestUtils";

describe("Empty Command Flow Integration", () => {
    let app: App;
    let adminUser: TestUser;
    let modUser: TestUser;
    let regularUser: TestUser;

    beforeEach(() => {
        // Ensure test isolation
        ensureTestIsolation();

        // Create fresh app instance for each test
        app = createMockApp("EmptyCommandFlowTestStore");

        // Create test users
        adminUser = createAdminUser("TestAdmin");
        modUser = createModUser("TestMod");
        regularUser = createChatUser("TestUser");
    });

    describe("Complete Empty Command Flow", () => {
        it("should handle the complete flow from empty command to help display", () => {
            // Test the complete flow: empty command -> help display
            const response = executeCommand(app, modUser, "ch", "");

            // Verify response structure
            expect(response).toHaveProperty("error");
            expect(response).toHaveProperty("message");
            expect(response.error).toBe(false);

            // Verify help content is returned
            expect(response.message).toContain("Available commands:");
            expect(response.message).toContain("!ch add");
            expect(response.message).toContain("!ch edit");
            expect(response.message).toContain("!ch done");
            expect(response.message).toContain("!ch delete");
            expect(response.message).toContain("!ch list");
            expect(response.message).toContain("!ch help");
        });

        it("should silently ignore empty commands from unauthorized users", () => {
            // Regular users should get silent ignore for empty commands
            const response = executeCommand(app, regularUser, "ch", "");

            expectSilentIgnore(response);
        });

        it("should work consistently across different user types with permissions", () => {
            // Test both moderator and broadcaster get help
            const modResponse = executeCommand(app, modUser, "ch", "");
            const adminResponse = executeCommand(app, adminUser, "ch", "");

            // Both should succeed
            expect(modResponse.error).toBe(false);
            expect(adminResponse.error).toBe(false);

            // Both should contain help content
            expect(modResponse.message).toContain("Available commands:");
            expect(adminResponse.message).toContain("Available commands:");

            // Both should have the same help content
            expect(modResponse.message).toBe(adminResponse.message);
        });
    });

    describe("Comparison with Explicit Help Command", () => {
        it("should provide identical results for empty command and explicit help", () => {
            // Execute both empty command and explicit help
            const emptyResponse = executeCommand(app, modUser, "ch", "");
            const helpResponse = executeCommand(app, modUser, "ch", "help");

            // Both should succeed
            expect(emptyResponse.error).toBe(false);
            expect(helpResponse.error).toBe(false);

            // Both should have identical content
            expect(emptyResponse.message).toBe(helpResponse.message);
        });

        it("should maintain consistency across different whitespace scenarios", () => {
            // Test various whitespace scenarios
            const emptyResponse = executeCommand(app, modUser, "ch", "");
            const spacesResponse = executeCommand(app, modUser, "ch", "   ");
            const tabsResponse = executeCommand(app, modUser, "ch", "\t");
            const mixedResponse = executeCommand(app, modUser, "ch", " \t \n ");

            // All should succeed
            expect(emptyResponse.error).toBe(false);
            expect(spacesResponse.error).toBe(false);
            expect(tabsResponse.error).toBe(false);
            expect(mixedResponse.error).toBe(false);

            // All should have the same help content
            expect(emptyResponse.message).toBe(spacesResponse.message);
            expect(emptyResponse.message).toBe(tabsResponse.message);
            expect(emptyResponse.message).toBe(mixedResponse.message);
        });
    });

    describe("Error Handling", () => {
        it("should handle edge cases gracefully", () => {
            // Test with null-like scenarios
            const response = app.chatHandler(
                modUser.username,
                "ch",
                "", // Empty message
                modUser.flags,
                modUser.extra
            );

            expect(response.error).toBe(false);
            expect(response.message).toContain("Available commands:");
        });
    });
});
