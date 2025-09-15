import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Timer from "../../src/utils/Timer";

// ============================================================================
// TEST CONSTANTS AND DATA
// ============================================================================

/**
 * Standard test durations for consistent testing
 */
const TEST_DURATIONS = {
    SHORT: 60,      // 1 minute
    MEDIUM: 300,    // 5 minutes
    LONG: 3600,     // 1 hour
} as const;

/**
 * Time advancement values in milliseconds
 */
const TIME_ADVANCES = {
    SHORT: 30000,   // 30 seconds
    MEDIUM: 60000,  // 1 minute
    LONG: 120000,   // 2 minutes
    EXPIRE: 310000, // 5+ minutes (to expire 5-minute timer)
} as const;

/**
 * Expected status display emojis
 */
const STATUS_EMOJIS = {
    INACTIVE: "",
    NORMAL: "⏱️",
    WARNING: "🟡",
    CRITICAL: "🔴",
    EXPIRED: "⏰",
    PAUSED: "⏸️",
} as const;

/**
 * Test data for valid duration parsing
 */
const VALID_DURATION_TEST_CASES: [string, number, string][] = [
    // [input, expectedSeconds, description]
    ["90s", 90, "seconds format"],
    ["30s", 30, "seconds format"],
    ["10m", 600, "minutes format"],
    ["5m", 300, "minutes format"],
    ["1h", 3600, "hours format"],
    ["2h", 7200, "hours format"],
    ["1h30m", 5400, "combined hours and minutes"],
    ["1h30m45s", 5445, "combined hours, minutes, and seconds"],
    ["25m30s", 1530, "combined minutes and seconds"],
    ["12:30", 750, "clock format mm:ss"],
    ["05:00", 300, "clock format mm:ss with leading zero"],
    ["1:30:45", 5445, "clock format hh:mm:ss"],
    ["0:05:30", 330, "clock format hh:mm:ss with zero hour"],
    ["10M", 600, "case insensitive minutes"],
    ["1H30M", 5400, "case insensitive combined format"],
];

/**
 * Test data for duration parsing errors
 */
const ERROR_TEST_CASES: [string, string, string][] = [
    // [input, expectedErrorMessage, description]
    ["invalid", "Invalid timer format", "invalid format"],
    ["", "Timer duration must be a string", "empty string"],
    ["10x", "Invalid timer format", "invalid unit"],
    ["25:70", "Invalid time values", "invalid minutes in clock format"],
    ["1:70:30", "Invalid time values", "invalid minutes in hh:mm:ss format"],
    ["1:30:70", "Invalid time values", "invalid seconds in hh:mm:ss format"],
    ["0s", "Timer duration must be greater than 0", "zero duration"],
    ["-5m", "Invalid duration value", "negative duration"],
];

/**
 * Test data for time formatting
 */
const TIME_FORMAT_TEST_CASES: [number, string][] = [
    [0, "0s"],
    [30, "30s"],
    [60, "1m"],
    [90, "1m 30s"],
    [3600, "1h"],
    [3661, "1h 1m 1s"],
];

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a test timer with specified duration
 * @param duration - Duration in seconds (defaults to TEST_DURATIONS.MEDIUM)
 * @returns Timer instance ready for testing
 */
const createTestTimer = (duration: number = TEST_DURATIONS.MEDIUM): Timer => {
    return new Timer(duration);
};

/**
 * Asserts timer state properties
 * @param timer - Timer instance to check
 * @param expected - Expected state properties
 */
const assertTimerState = (
    timer: Timer,
    expected: {
        isActive?: boolean;
        isPaused?: boolean;
        duration?: number;
    }
): void => {
    if (expected.isActive !== undefined) {
        expect(timer.isActive).toBe(expected.isActive);
    }
    if (expected.isPaused !== undefined) {
        expect(timer.isPaused).toBe(expected.isPaused);
    }
    if (expected.duration !== undefined) {
        expect(timer.duration).toBe(expected.duration);
    }
};

/**
 * Advances time and asserts remaining time
 * @param timer - Timer instance
 * @param advanceMs - Milliseconds to advance
 * @param expectedRemaining - Expected remaining seconds
 */
const advanceTimeAndAssert = (
    timer: Timer,
    advanceMs: number,
    expectedRemaining: number
): void => {
    vi.advanceTimersByTime(advanceMs);
    expect(timer.getRemainingTime()).toBe(expectedRemaining);
};

/**
 * Asserts timer status display
 * @param timer - Timer instance
 * @param expectedStatus - Expected status emoji
 */
const assertTimerStatus = (timer: Timer, expectedStatus: string): void => {
    expect(timer.getStatusDisplay()).toBe(expectedStatus);
};

// ============================================================================
// TESTS
// ============================================================================

describe("Timer", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("parseDuration", () => {
        describe("valid formats", () => {
            it.each(VALID_DURATION_TEST_CASES)(
                "should parse %s as %d seconds (%s)",
                (input, expectedSeconds) => {
                    expect(Timer.parseDuration(input)).toBe(expectedSeconds);
                }
            );
        });

        describe("error cases", () => {
            it.each(ERROR_TEST_CASES)(
                "should throw error for %s (%s)",
                (input, expectedError) => {
                    expect(() => Timer.parseDuration(input)).toThrow(expectedError);
                }
            );
        });
    });

    describe("Timer functionality", () => {
        let timer: Timer;

        beforeEach(() => {
            timer = createTestTimer(); // 300 seconds (5 minutes) for testing
        });

        describe("initialization", () => {
            it("should initialize with correct properties", () => {
                assertTimerState(timer, {
                    duration: TEST_DURATIONS.MEDIUM,
                    isActive: false,
                    isPaused: false,
                });
            });
        });

        describe("timing operations", () => {
            it("should start timer correctly", () => {
                const startTime = Date.now();
                timer.start();

                assertTimerState(timer, { isActive: true, isPaused: false });
                expect(timer.startTime).toBe(startTime);
                expect(timer.endTime).toBe(startTime + TEST_DURATIONS.MEDIUM * 1000);
            });

            it("should calculate remaining time correctly", () => {
                timer.start();
                advanceTimeAndAssert(timer, TIME_ADVANCES.SHORT, 270);
            });

            it("should detect expiration", () => {
                timer.start();
                advanceTimeAndAssert(timer, TIME_ADVANCES.EXPIRE, 0);
                expect(timer.isExpired()).toBe(true);
            });

            it("should stop timer correctly", () => {
                timer.start();
                vi.advanceTimersByTime(TIME_ADVANCES.SHORT);

                timer.stop();

                assertTimerState(timer, { isActive: false, isPaused: false });
                expect(timer.getRemainingTime()).toBe(0);
            });
        });

        describe("pause and resume", () => {
            it("should pause and resume correctly", () => {
                timer.start();

                // Advance 20 seconds, then pause
                vi.advanceTimersByTime(20000);
                timer.pause();

                assertTimerState(timer, { isPaused: true });
                expect(timer.getRemainingTime()).toBe(280);

                // Advance 10 seconds while paused (should not affect remaining time)
                vi.advanceTimersByTime(10000);
                expect(timer.getRemainingTime()).toBe(280);

                // Resume
                timer.resume();
                assertTimerState(timer, { isPaused: false });

                // Advance 20 more seconds
                advanceTimeAndAssert(timer, 20000, 260);
            });
        });

        describe("time formatting", () => {
            it.each(TIME_FORMAT_TEST_CASES)(
                "should format %d seconds as '%s'",
                (seconds, expectedFormat) => {
                    expect(timer.getFormattedTime(seconds)).toBe(expectedFormat);
                }
            );
        });

        describe("status display", () => {
            it("should show correct status for inactive timer", () => {
                assertTimerStatus(timer, STATUS_EMOJIS.INACTIVE);
            });

            it("should show correct status for active timer", () => {
                timer.start();
                assertTimerStatus(timer, STATUS_EMOJIS.NORMAL);
            });

            it("should show warning status when time is low", () => {
                timer.start();
                // Advance to 118 seconds remaining (warning threshold is 120s)
                vi.advanceTimersByTime(182000);
                assertTimerStatus(timer, STATUS_EMOJIS.WARNING);
            });

            it("should show critical status when time is very low", () => {
                timer.start();
                // Advance to 29 seconds remaining (critical threshold is 30s)
                vi.advanceTimersByTime(271000);
                assertTimerStatus(timer, STATUS_EMOJIS.CRITICAL);
            });

            it("should show expired status when timer expires", () => {
                timer.start();
                vi.advanceTimersByTime(TIME_ADVANCES.EXPIRE);
                assertTimerStatus(timer, STATUS_EMOJIS.EXPIRED);
            });

            it("should show paused status when timer is paused", () => {
                timer.start();
                timer.pause();
                assertTimerStatus(timer, STATUS_EMOJIS.PAUSED);
            });
        });
    });

    describe("serialization", () => {
        it("should serialize and deserialize correctly", () => {
            const originalTimer = createTestTimer(120);
            originalTimer.start();

            const data = originalTimer.toData();
            const deserializedTimer = Timer.fromData(data);

            // Verify all properties are preserved
            expect(deserializedTimer.duration).toBe(originalTimer.duration);
            expect(deserializedTimer.startTime).toBe(originalTimer.startTime);
            expect(deserializedTimer.endTime).toBe(originalTimer.endTime);
            assertTimerState(deserializedTimer, {
                isActive: originalTimer.isActive,
                isPaused: originalTimer.isPaused,
            });
        });
    });
});
