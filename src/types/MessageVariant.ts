/**
 * Message variant enum for BroadcastChannel communication
 * Used to specify which windows should respond to a message
 */
export enum MessageVariant {
    ALL = "all",
    VIEWER_ONLY = "viewer-only",
}
