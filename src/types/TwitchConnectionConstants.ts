/**
 * Twitch chat service connection status constants.
 * Centralizes status strings so backend services avoid magic literals.
 */

export const TWITCH_CONNECTION_STATUS = {
    IDLE: "idle",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    DISCONNECTED: "disconnected",
    ERROR: "error",
} as const;

export type TwitchConnectionStatusValue =
    (typeof TWITCH_CONNECTION_STATUS)[keyof typeof TWITCH_CONNECTION_STATUS];
