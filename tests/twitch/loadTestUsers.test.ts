import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadTestUsers } from "../../src/twitch/loadTestUsers";
import TwitchChat from "../../src/twitch/TwitchChat";
import { TWITCH_EVENTS } from "../../src/types/ConfigConstants";

// ============================================================================
// TEST CONSTANTS
// ============================================================================

/**
 * Expected test data constants
 */
const TEST_CONSTANTS = {
    USER_COUNT: 5,
    CHALLENGES_PER_USER: 10,
    COLOR_OPTIONS: [
        "red",
        "coral",
        "springGreen",
        "lightSeaGreen",
        "slateBlue",
        "hotpink",
        "violet",
        "orange",
        "darkTurquoise",
        "dodgerblue",
        "blueviolet",
    ],
    INITIAL_CLEAR_COMMAND: "clearList",
    CHALLENGE_COMMAND: "challenge",
    DONE_COMMAND: "done",
} as const;

/**
 * Timeout calculation constants
 */
const TIMEOUT_CONSTANTS = {
    BASE_USER_DELAY: 1000, // Base delay per user (1000ms * i)
    CHALLENGE_DELAY: 100, // Delay between challenges (j * 100ms)
    DONE_DELAY: 10000, // Delay for done command (10000ms)
} as const;

// ============================================================================
// MOCK SETUP
// ============================================================================

/**
 * Mock WebSocket interface for TwitchChat testing
 */
interface MockWebSocket {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    onopen: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
    readyState: number;
}

/**
 * Command data interface for type-safe assertions
 */
interface CommandData {
    user: string;
    command: string;
    message: string;
    flags: {
        broadcaster: boolean;
        mod: boolean;
    };
    extra: {
        userColor: string;
        messageId: string;
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a mock TwitchChat instance for testing
 * @returns Object containing mock TwitchChat instance and mock WebSocket
 */
const createMockTwitchChat = (): {
    twitchChat: TwitchChat;
    mockWsInstance: MockWebSocket;
} => {
    const mockWsInstance: MockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        onopen: null,
        onclose: null,
        onerror: null,
        onmessage: null,
        readyState: WebSocket.CONNECTING,
    };

    const mockWebSocket = vi.fn(() => mockWsInstance) as any; // Complex WebSocket mock with overloaded signatures

    const twitchChat = new TwitchChat(
        "ws://test-url:80",
        {
            username: "testUser",
            authToken: "oauth:testtoken",
            channel: "testchannel",
        },
        mockWebSocket
    );

    return { twitchChat, mockWsInstance };
};

/**
 * Calculates expected timeout for a challenge command
 * @param userIndex - User index (1-5)
 * @param challengeIndex - Challenge index (0-9)
 * @returns Expected timeout in milliseconds
 */
const calculateChallengeTimeout = (
    userIndex: number,
    challengeIndex: number
): number => {
    return (
        TIMEOUT_CONSTANTS.BASE_USER_DELAY * userIndex +
        challengeIndex * TIMEOUT_CONSTANTS.CHALLENGE_DELAY
    );
};

/**
 * Calculates expected timeout for a done command
 * @param userIndex - User index (1-5)
 * @returns Expected timeout in milliseconds
 */
const calculateDoneTimeout = (userIndex: number): number => {
    return (
        TIMEOUT_CONSTANTS.BASE_USER_DELAY * userIndex +
        TIMEOUT_CONSTANTS.DONE_DELAY
    );
};

/**
 * Asserts that a command event was emitted with expected data
 * @param emitSpy - Spy on the emit method
 * @param callIndex - Index of the emit call to check
 * @param expectedCommand - Expected command type
 * @param expectedUser - Expected username
 * @param expectedMessage - Expected message content
 * @param expectedColor - Expected user color
 */
const assertCommandEmitted = (
    emitSpy: ReturnType<typeof vi.spyOn>,
    callIndex: number,
    expectedCommand: string,
    expectedUser: string,
    expectedMessage: string,
    expectedColor?: string
): void => {
    const call = emitSpy.mock.calls[callIndex];
    expect(call).toBeDefined();
    expect(call?.[0]).toBe(TWITCH_EVENTS.COMMAND);

    const data = call?.[1] as CommandData;
    expect(data).toBeDefined();
    expect(data.command).toBe(expectedCommand);
    expect(data.user).toBe(expectedUser);
    expect(data.message).toBe(expectedMessage);
    expect(data.flags).toEqual({ broadcaster: true, mod: false });
    expect(data.extra).toBeDefined();
    expect(data.extra.messageId).toBeDefined();

    if (expectedColor) {
        expect(data.extra.userColor).toBe(expectedColor);
    }
};

// ============================================================================
// TESTS
// ============================================================================

describe("loadTestUsers", () => {
    let twitchChat: TwitchChat;
    let emitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Use fake timers for setTimeout testing
        vi.useFakeTimers();

        // Create mock TwitchChat instance
        const { twitchChat: mockChat } = createMockTwitchChat();
        twitchChat = mockChat;

        // Spy on emit method
        emitSpy = vi.spyOn(twitchChat, "emit");
    });

    afterEach(() => {
        // Restore real timers
        vi.useRealTimers();

        // Restore all mocks
        vi.restoreAllMocks();
    });

    describe("Initial clearList command", () => {
        it("should emit clearList command immediately", () => {
            loadTestUsers(twitchChat);

            // First emit should be clearList
            assertCommandEmitted(
                emitSpy,
                0,
                TEST_CONSTANTS.INITIAL_CLEAR_COMMAND,
                "adminUser",
                "",
                "#FF0000"
            );
        });

        it("should emit clearList with broadcaster permissions", () => {
            loadTestUsers(twitchChat);

            const clearListCall = emitSpy.mock.calls[0];
            const data = clearListCall?.[1] as CommandData;

            expect(data.flags.broadcaster).toBe(true);
            expect(data.flags.mod).toBe(false);
        });
    });

    describe("Challenge command generation", () => {
        it("should generate correct number of users", () => {
            loadTestUsers(twitchChat);

            // Advance timers to execute all scheduled commands
            vi.runAllTimers();

            // Calculate expected total emits:
            // 1 clearList + (5 users * 10 challenges) + (5 users * 1 done) = 56
            const expectedEmits = 1 + TEST_CONSTANTS.USER_COUNT * 11;
            expect(emitSpy).toHaveBeenCalledTimes(expectedEmits);
        });

        it("should generate correct number of challenges per user", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            // Count challenge commands for each user
            const challengeCounts: Record<string, number> = {};

            emitSpy.mock.calls.forEach((call) => {
                const data = call[1] as CommandData;
                if (data.command === TEST_CONSTANTS.CHALLENGE_COMMAND) {
                    const user = data.user;
                    challengeCounts[user] = (challengeCounts[user] || 0) + 1;
                }
            });

            // Each user should have exactly 10 challenges
            for (let i = 1; i <= TEST_CONSTANTS.USER_COUNT; i++) {
                const userName = `Username${i}`;
                expect(challengeCounts[userName]).toBe(
                    TEST_CONSTANTS.CHALLENGES_PER_USER
                );
            }
        });

        it("should use correct usernames for each user", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const usernames = new Set<string>();

            emitSpy.mock.calls.forEach((call) => {
                const data = call[1] as CommandData;
                if (data.command === TEST_CONSTANTS.CHALLENGE_COMMAND) {
                    usernames.add(data.user);
                }
            });

            // Should have exactly 5 unique usernames
            expect(usernames.size).toBe(TEST_CONSTANTS.USER_COUNT);

            // Verify each expected username exists
            for (let i = 1; i <= TEST_CONSTANTS.USER_COUNT; i++) {
                expect(usernames.has(`Username${i}`)).toBe(true);
            }
        });

        it("should assign correct colors to users", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            // Check colors for each user
            for (let i = 1; i <= TEST_CONSTANTS.USER_COUNT; i++) {
                const userName = `Username${i}`;
                const expectedColor = TEST_CONSTANTS.COLOR_OPTIONS[i - 1];

                // Find a challenge command for this user
                const userCall = emitSpy.mock.calls.find((call) => {
                    const data = call[1] as CommandData;
                    return (
                        data.command === TEST_CONSTANTS.CHALLENGE_COMMAND &&
                        data.user === userName
                    );
                });

                expect(userCall).toBeDefined();
                const userData = userCall?.[1] as CommandData;
                expect(userData.extra.userColor).toBe(expectedColor);
            }
        });

        it("should include longer text example for third challenge (j === 2)", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            // Find challenges where j === 2 (third challenge for each user)
            const challengesWithLongerText = emitSpy.mock.calls.filter(
                (call) => {
                    const data = call[1] as CommandData;
                    return (
                        data.command === TEST_CONSTANTS.CHALLENGE_COMMAND &&
                        data.message.includes("longer text example")
                    );
                }
            );

            // Should have exactly 5 challenges with longer text (one per user)
            expect(challengesWithLongerText.length).toBe(
                TEST_CONSTANTS.USER_COUNT
            );

            // Verify the message format
            challengesWithLongerText.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.message).toBe(
                    "test challenge description longer text example"
                );
            });
        });

        it("should use standard description for non-third challenges", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            // Find challenges where j !== 2
            const standardChallenges = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return (
                    data.command === TEST_CONSTANTS.CHALLENGE_COMMAND &&
                    !data.message.includes("longer text example")
                );
            });

            // Should have 45 standard challenges (5 users * 9 non-third challenges)
            expect(standardChallenges.length).toBe(
                TEST_CONSTANTS.USER_COUNT * 9
            );

            // Verify the message format
            standardChallenges.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.message).toBe("test challenge description ");
            });
        });

        it("should include messageId for all challenge commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const challengeCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
            });

            challengeCalls.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.extra.messageId).toBeDefined();
                expect(typeof data.extra.messageId).toBe("string");
                expect(data.extra.messageId.length).toBeGreaterThan(0);
            });
        });

        it("should set broadcaster permissions for all challenge commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const challengeCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
            });

            challengeCalls.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.flags.broadcaster).toBe(true);
                expect(data.flags.mod).toBe(false);
            });
        });
    });

    describe("Done command generation", () => {
        it("should emit done command for each user", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            // Should have exactly 5 done commands (one per user)
            expect(doneCalls.length).toBe(TEST_CONSTANTS.USER_COUNT);
        });

        it("should emit done command with message '1'", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            doneCalls.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.message).toBe("1");
            });
        });

        it("should use correct username for done commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            // Verify each user has a done command
            for (let i = 1; i <= TEST_CONSTANTS.USER_COUNT; i++) {
                const userName = `Username${i}`;
                const userDoneCall = doneCalls.find((call) => {
                    const data = call[1] as CommandData;
                    return data.user === userName;
                });
                expect(userDoneCall).toBeDefined();
            }
        });

        it("should use correct color for done commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            doneCalls.forEach((call, index) => {
                const data = call[1] as CommandData;
                const expectedColor = TEST_CONSTANTS.COLOR_OPTIONS[index];
                expect(data.extra.userColor).toBe(expectedColor);
            });
        });

        it("should set broadcaster permissions for done commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            doneCalls.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.flags.broadcaster).toBe(true);
                expect(data.flags.mod).toBe(false);
            });
        });

        it("should include messageId for done commands", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const doneCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });

            doneCalls.forEach((call) => {
                const data = call[1] as CommandData;
                expect(data.extra.messageId).toBeDefined();
                expect(typeof data.extra.messageId).toBe("string");
                expect(data.extra.messageId.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Timeout scheduling", () => {
        it("should schedule challenge commands with correct timeouts", () => {
            const setTimeoutSpy = vi.spyOn(global, "setTimeout");

            loadTestUsers(twitchChat);

            // Calculate expected number of setTimeout calls
            // 50 challenges + 5 done commands = 55 setTimeout calls
            const expectedTimeoutCalls =
                TEST_CONSTANTS.USER_COUNT * TEST_CONSTANTS.CHALLENGES_PER_USER +
                TEST_CONSTANTS.USER_COUNT;

            expect(setTimeoutSpy).toHaveBeenCalledTimes(expectedTimeoutCalls);
        });

        it("should schedule first user's first challenge at correct time", () => {
            loadTestUsers(twitchChat);

            // Don't run all timers yet
            const expectedTimeout = calculateChallengeTimeout(1, 0);

            // Advance to just before the timeout
            vi.advanceTimersByTime(expectedTimeout - 1);

            // Should have only clearList emitted (index 0)
            const challengeCalls = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
            });
            expect(challengeCalls.length).toBe(0);

            // Advance past the timeout
            vi.advanceTimersByTime(1);

            // Now should have first challenge
            const challengeCallsAfter = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
            });
            expect(challengeCallsAfter.length).toBe(1);
        });

        it("should schedule done commands with correct delay", () => {
            loadTestUsers(twitchChat);

            // Advance to just before first done command
            const firstDoneTimeout = calculateDoneTimeout(1);
            vi.advanceTimersByTime(firstDoneTimeout - 1);

            // Should have no done commands yet
            const doneCallsBefore = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });
            expect(doneCallsBefore.length).toBe(0);

            // Advance past the timeout
            vi.advanceTimersByTime(1);

            // Now should have first done command
            const doneCallsAfter = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.DONE_COMMAND;
            });
            expect(doneCallsAfter.length).toBe(1);
        });

        it("should stagger challenges across users", () => {
            loadTestUsers(twitchChat);

            // Advance to after first user's challenges but before second user's
            const firstUserLastChallenge = calculateChallengeTimeout(1, 9);
            const secondUserFirstChallenge = calculateChallengeTimeout(2, 0);

            vi.advanceTimersByTime(firstUserLastChallenge + 1);

            const challengesAfterUser1 = emitSpy.mock.calls.filter((call) => {
                const data = call[1] as CommandData;
                return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
            });

            // Should have all 10 challenges from user 1
            expect(challengesAfterUser1.length).toBe(10);

            // Advance to second user's first challenge
            vi.advanceTimersByTime(
                secondUserFirstChallenge - firstUserLastChallenge
            );

            const challengesAfterUser2Start = emitSpy.mock.calls.filter(
                (call) => {
                    const data = call[1] as CommandData;
                    return data.command === TEST_CONSTANTS.CHALLENGE_COMMAND;
                }
            );

            // Should now have 11 challenges (10 from user1 + 1 from user2)
            expect(challengesAfterUser2Start.length).toBe(11);
        });
    });

    describe("generateTimeStamp helper function", () => {
        it("should generate unique messageIds", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            const messageIds = new Set<string>();

            emitSpy.mock.calls.forEach((call) => {
                if (call[0] === TWITCH_EVENTS.COMMAND) {
                    const data = call[1] as CommandData;
                    messageIds.add(data.extra.messageId);
                }
            });

            // All messageIds should be unique
            // Total: 1 clearList + 50 challenges + 5 done = 56
            expect(messageIds.size).toBe(56);
        });

        it("should generate numeric string messageIds", () => {
            loadTestUsers(twitchChat);
            vi.runAllTimers();

            emitSpy.mock.calls.forEach((call) => {
                if (call[0] === TWITCH_EVENTS.COMMAND) {
                    const data = call[1] as CommandData;
                    const messageId = data.extra.messageId;
                    expect(typeof messageId).toBe("string");
                    expect(Number.isNaN(Number(messageId))).toBe(false);
                }
            });
        });
    });

    describe("Edge cases and error handling", () => {
        it("should handle TwitchChat instance without errors", () => {
            expect(() => loadTestUsers(twitchChat)).not.toThrow();
        });

        it("should emit all commands even with different TwitchChat configurations", () => {
            // Create a different TwitchChat instance
            const { twitchChat: altChat } = createMockTwitchChat();
            const altEmitSpy = vi.spyOn(altChat, "emit");

            loadTestUsers(altChat);
            vi.runAllTimers();

            // Should still emit all 56 commands
            expect(altEmitSpy).toHaveBeenCalledTimes(56);
        });

        it("should complete all scheduled commands when timers run", () => {
            loadTestUsers(twitchChat);

            // Verify no commands emitted yet (except clearList)
            expect(emitSpy).toHaveBeenCalledTimes(1);

            // Run all timers
            vi.runAllTimers();

            // Verify all commands emitted
            expect(emitSpy).toHaveBeenCalledTimes(56);
        });
    });
});
