/**
 * Refresh message type enum for BroadcastChannel communication
 * Used to specify the type of refresh message being sent
 */
export enum RefreshMessageType {
    CONFIG_SAVED = "config-saved",
    CHALLENGE_STATE_CHANGED = "challenge-state-changed",
    HEARTBEAT = "heartbeat",
}
