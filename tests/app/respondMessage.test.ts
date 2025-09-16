import { beforeEach, describe, expect, it } from "vitest";
import App from "../../src/app";
import { createMockApp, executeCommand, type TestUser } from "../utils/chatHandlerTestUtils";

describe("App respondMessage function", () => {
    let app: App;

    // Test user for triggering responses
    const testUser: TestUser = {
        username: "testuser",
        flags: {
            broadcaster: false,
            mod: false,
        },
        extra: {
            userColor: "#FF0000",
        },
    };

    beforeEach(() => {
        app = createMockApp("RespondMessageTest");
    });

    describe("Single placeholder replacement", () => {
        it("should replace single {message} placeholder", () => {
            // Trigger an invalid command to get a response with {message} placeholder
            const response = executeCommand(app, testUser, "invalidcommand", "");

            expect(response.error).toBe(true);
            expect(response.message).toContain("command not found");
            expect(response.message).not.toContain("{message}");
        });
    });

    describe("Multiple placeholder replacement", () => {
        it("should replace multiple {user} placeholders in template", () => {
            // We need to test this by modifying the configuration to have multiple {user} placeholders
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with multiple {user} placeholders
            const multiUserTemplate = "Hello {user}, your command was invalid. Please try again {user}!";
            configManager.set("responses.invalidCommand", multiUserTemplate);
            
            const response = executeCommand(app, testUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("Hello testuser, your command was invalid. Please try again testuser!");
            expect(response.message).not.toContain("{user}");
            
            // Count occurrences of username
            const usernameCount = (response.message.match(/testuser/g) || []).length;
            expect(usernameCount).toBe(2);
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });

        it("should replace multiple {message} placeholders in template", () => {
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with multiple {message} placeholders
            const multiMessageTemplate = "Error: {message}. The issue was: {message}";
            configManager.set("responses.invalidCommand", multiMessageTemplate);
            
            const response = executeCommand(app, testUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("Error: command not found. The issue was: command not found");
            expect(response.message).not.toContain("{message}");
            
            // Count occurrences of the error message
            const messageCount = (response.message.match(/command not found/g) || []).length;
            expect(messageCount).toBe(2);
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });

        it("should replace multiple mixed placeholders in template", () => {
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with multiple mixed placeholders
            const mixedTemplate = "Hello {user}, your message '{message}' was received. Thanks {user} for using {message} command!";
            configManager.set("responses.invalidCommand", mixedTemplate);
            
            const response = executeCommand(app, testUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("Hello testuser, your message 'command not found' was received. Thanks testuser for using command not found command!");
            expect(response.message).not.toContain("{user}");
            expect(response.message).not.toContain("{message}");
            
            // Verify both placeholders were replaced multiple times
            const usernameCount = (response.message.match(/testuser/g) || []).length;
            const messageCount = (response.message.match(/command not found/g) || []).length;
            expect(usernameCount).toBe(2);
            expect(messageCount).toBe(2);
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });
    });

    describe("Edge cases", () => {
        it("should handle template with no placeholders", () => {
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with no placeholders
            const noPlaceholderTemplate = "This is a static message with no placeholders";
            configManager.set("responses.invalidCommand", noPlaceholderTemplate);
            
            const response = executeCommand(app, testUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("This is a static message with no placeholders");
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });

        it("should handle empty username and message", () => {
            const emptyUser: TestUser = {
                username: "",
                flags: {
                    broadcaster: false,
                    mod: false,
                },
                extra: {
                    userColor: "#FF0000",
                },
            };
            
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with placeholders
            const placeholderTemplate = "User: {user}, Message: {message}";
            configManager.set("responses.invalidCommand", placeholderTemplate);
            
            const response = executeCommand(app, emptyUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("User: , Message: command not found");
            expect(response.message).not.toContain("{user}");
            expect(response.message).not.toContain("{message}");
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });

        it("should handle template with only one type of placeholder repeated", () => {
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with only {user} placeholders repeated
            const userOnlyTemplate = "{user} {user} {user}";
            configManager.set("responses.invalidCommand", userOnlyTemplate);
            
            const response = executeCommand(app, testUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("testuser testuser testuser");
            expect(response.message).not.toContain("{user}");
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });

        it("should handle special characters in username and message", () => {
            const specialUser: TestUser = {
                username: "user@#$%",
                flags: {
                    broadcaster: false,
                    mod: false,
                },
                extra: {
                    userColor: "#FF0000",
                },
            };
            
            const configManager = app.getConfigManager();
            const originalTemplate = configManager.get("responses.invalidCommand");
            
            // Set a template with multiple placeholders
            const specialTemplate = "Hello {user}! Your input '{message}' failed. Try again {user}.";
            configManager.set("responses.invalidCommand", specialTemplate);
            
            const response = executeCommand(app, specialUser, "invalidcommand", "");
            
            expect(response.error).toBe(true);
            expect(response.message).toBe("Hello user@#$%! Your input 'command not found' failed. Try again user@#$%.");
            expect(response.message).not.toContain("{user}");
            expect(response.message).not.toContain("{message}");
            
            // Restore original template
            configManager.set("responses.invalidCommand", originalTemplate);
        });
    });
});
