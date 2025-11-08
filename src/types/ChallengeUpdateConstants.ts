/**
 * Challenge update constants and types
 * Centralizes event type/origin/reason strings to eliminate hardcoded literals.
 */

export const CHALLENGE_UPDATE_TYPES = {
    INIT: "init",
    SYNC: "sync",
    ADD: "add",
    UPDATE: "update",
    DELETE: "delete",
    REORDER: "reorder",
} as const;

export type ChallengeUpdateTypeValue =
    (typeof CHALLENGE_UPDATE_TYPES)[keyof typeof CHALLENGE_UPDATE_TYPES];

export const CHALLENGE_UPDATE_ORIGINS = {
    LOCAL: "local",
    EXTERNAL: "external",
} as const;

export type ChallengeUpdateOriginValue =
    (typeof CHALLENGE_UPDATE_ORIGINS)[keyof typeof CHALLENGE_UPDATE_ORIGINS];

export const CHALLENGE_UPDATE_REASONS = {
    CLEAR_ALL: "clear-all",
    TIMER_START: "timer-start",
    TIMER_PAUSE: "timer-pause",
    TIMER_RESUME: "timer-resume",
    TIMER_STOP: "timer-stop",
    TIMER_CLEAR: "timer-clear",
    BROADCAST: "broadcast",
} as const;

export type ChallengeUpdateReasonValue =
    (typeof CHALLENGE_UPDATE_REASONS)[keyof typeof CHALLENGE_UPDATE_REASONS];
