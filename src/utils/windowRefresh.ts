/**
 * Window Refresh Communication Module
 *
 * Handles BroadcastChannel communication for automatic window refresh
 * functionality when configuration changes are saved in the admin panel.
 *
 * @module windowRefresh
 */

import { BROADCAST_CHANNEL_NAMES, URL_HASH } from "../types/DOMConstants";
import { MessageVariant } from "../types/MessageVariant";
import { RefreshMessageType } from "../types/RefreshMessageType";
import { WindowMode } from "../types/WindowMode";

/**
 * Message types for BroadcastChannel communication
 */
export interface RefreshMessage {
    type: RefreshMessageType;
    variant?: MessageVariant;
    timestamp: number;
    source: WindowMode;
}

/**
 * Configuration for the window refresh system
 */
interface RefreshConfig {
    channelName: string;
    refreshDelay: number;
}

/**
 * Default configuration for the refresh system
 */
const DEFAULT_CONFIG: RefreshConfig = {
    channelName: BROADCAST_CHANNEL_NAMES.CONFIG_UPDATES,
    refreshDelay: 500, // milliseconds to wait before refresh
};

/**
 * Heartbeat configuration constants
 */
const HEARTBEAT_INTERVAL = 5000; // Send heartbeat every 5 seconds (admin mode)
const HEARTBEAT_TIMEOUT = 15000; // Consider connection lost after 15 seconds (viewer mode)

/**
 * @class WindowRefreshManager
 * Manages BroadcastChannel communication for automatic window refresh
 * when configuration changes are saved.
 */
export class WindowRefreshManager {
    private channel: BroadcastChannel | null = null;
    private config: RefreshConfig;
    private isAdminMode: boolean;
    private lastHeartbeatReceived: number | null = null;
    private heartbeatInterval: number | null = null;
    private initialLoadTimestamp: number | null = null;

    /**
     * @constructor
     * @param config - Optional configuration overrides
     */
    constructor(config: Partial<RefreshConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isAdminMode = window.location.hash === URL_HASH.ADMIN;
        this.initializeBroadcastChannel();

        // Set initial load timestamp for viewer mode (used for grace period)
        if (!this.isAdminMode) {
            this.initialLoadTimestamp = Date.now();
        }

        // Start sending heartbeats if in admin mode
        if (this.isAdminMode && this.channel) {
            this.startHeartbeat();
        }
    }

    /**
     * Initialize the BroadcastChannel for inter-window communication
     * @returns {void}
     */
    private initializeBroadcastChannel(): void {
        try {
            // Check if BroadcastChannel is supported
            if (typeof BroadcastChannel === "undefined") {
                console.warn(
                    "BroadcastChannel is not supported in this environment"
                );
                return;
            }

            this.channel = new BroadcastChannel(this.config.channelName);
            this.setupMessageListener();
        } catch (error) {
            console.error("Failed to initialize BroadcastChannel:", error);
        }
    }

    /**
     * Set up message listener for BroadcastChannel
     * @returns {void}
     */
    private setupMessageListener(): void {
        if (!this.channel) return;

        this.channel.addEventListener(
            "message",
            (event: MessageEvent<RefreshMessage>) => {
                const { type, timestamp, source } = event.data;

                // Validate message structure
                if (!type || !timestamp || !source) {
                    console.warn(
                        "Invalid refresh message received:",
                        event.data
                    );
                    return;
                }

                // Ignore messages from the same window type to prevent loops
                const currentSource = this.isAdminMode
                    ? WindowMode.ADMIN
                    : WindowMode.VIEWER;
                if (source === currentSource) {
                    return;
                }

                // Handle different message types
                if (type === RefreshMessageType.CONFIG_SAVED) {
                    // Skip refresh if this is admin mode and message is viewer-only
                    if (
                        this.isAdminMode &&
                        event.data.variant === MessageVariant.VIEWER_ONLY
                    ) {
                        // Admin mode: ignoring viewer-only config-saved message"
                        return;
                    }

                    // Received config-saved message from source window, refreshing...`
                    this.performRefresh();
                } else if (
                    type === RefreshMessageType.CHALLENGE_STATE_CHANGED
                ) {
                    // Received challenge-state-changed message from source window, triggering DOM update...`
                    this.triggerChallengeListRefresh();
                } else if (type === RefreshMessageType.HEARTBEAT) {
                    // Update last heartbeat timestamp (viewer mode only)
                    if (!this.isAdminMode) {
                        this.lastHeartbeatReceived = timestamp;
                    }
                }
            }
        );
    }

    /**
     * Send a configuration saved message to other windows
     * @returns {void}
     */
    public notifyConfigurationSaved(): void {
        if (!this.channel) {
            console.warn(
                "BroadcastChannel not available, cannot notify other windows"
            );
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.CONFIG_SAVED,
            timestamp: Date.now(),
            source: this.isAdminMode ? WindowMode.ADMIN : WindowMode.VIEWER,
        };

        try {
            this.channel.postMessage(message);
            console.log(
                "Configuration saved notification sent to other windows"
            );

            // Also refresh the current window after a short delay
            setTimeout(() => {
                this.performRefresh();
            }, this.config.refreshDelay);
        } catch (error) {
            console.error(
                "Failed to send configuration saved notification:",
                error
            );
        }
    }

    /**
     * Send a configuration saved message to viewer windows only
     * Admin window will NOT refresh - it updates UI directly
     * @returns {void}
     */
    public notifyConfigurationSavedViewerOnly(): void {
        if (!this.channel) {
            console.warn(
                "BroadcastChannel not available, cannot notify other windows"
            );
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.CONFIG_SAVED,
            variant: MessageVariant.VIEWER_ONLY,
            timestamp: Date.now(),
            source: this.isAdminMode ? WindowMode.ADMIN : WindowMode.VIEWER,
        };

        try {
            this.channel.postMessage(message);

            // NOTE: We do NOT call this.performRefresh() here
            // Admin window updates UI directly without refresh
        } catch (error) {
            console.error(
                "Failed to send configuration saved notification:",
                error
            );
        }
    }

    /**
     * Send a challenge state changed message to other windows
     * @returns {void}
     */
    public notifyChallengeStateChanged(): void {
        if (!this.channel) {
            console.warn(
                "BroadcastChannel not available, cannot notify other windows"
            );
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.CHALLENGE_STATE_CHANGED,
            timestamp: Date.now(),
            source: this.isAdminMode ? WindowMode.ADMIN : WindowMode.VIEWER,
        };

        try {
            this.channel.postMessage(message);
            console.log(
                "Challenge state changed notification sent to other windows"
            );
        } catch (error) {
            console.error(
                "Failed to send challenge state changed notification:",
                error
            );
        }
    }

    /**
     * Perform the actual window refresh
     * @returns {void}
     */
    private performRefresh(): void {
        try {
            // Add a small delay to ensure any pending operations complete
            setTimeout(() => {
                console.log(
                    "Refreshing window to apply configuration changes..."
                );
                window.location.reload();
            }, this.config.refreshDelay);
        } catch (error) {
            console.error("Failed to refresh window:", error);
        }
    }

    /**
     * Trigger a challenge list refresh by dispatching a custom event
     * This allows the App to handle the refresh without a full page reload
     * @returns {void}
     */
    private triggerChallengeListRefresh(): void {
        try {
            const event = new CustomEvent("challenge-list-refresh", {
                detail: { timestamp: Date.now() },
            });
            window.dispatchEvent(event);
            console.log("Challenge list refresh event dispatched");
        } catch (error) {
            console.error("Failed to trigger challenge list refresh:", error);
        }
    }

    /**
     * Check if the refresh system is available and functional
     * @returns {boolean} True if BroadcastChannel is supported and initialized
     */
    public isAvailable(): boolean {
        return this.channel !== null;
    }

    /**
     * Check if there is an active connection to the admin panel
     * In admin mode, always returns true (admin is always "connected" to itself)
     * In viewer mode, checks if:
     * 1. BroadcastChannel API is available
     * 2. A heartbeat has been received from admin panel within the timeout period
     * 3. If no heartbeat received yet, checks if still within initial grace period
     * @returns {boolean} True if connected to admin panel or in admin mode
     */
    public isConnected(): boolean {
        // Admin mode is always considered "connected"
        if (this.isAdminMode) {
            return true;
        }

        // Check if BroadcastChannel is available
        if (!this.isAvailable()) {
            return false;
        }

        // Check if we've received a heartbeat recently
        if (this.lastHeartbeatReceived === null) {
            // No heartbeat received yet - check if we're still in initial grace period
            if (this.initialLoadTimestamp !== null) {
                const timeSinceLoad = Date.now() - this.initialLoadTimestamp;
                if (timeSinceLoad < HEARTBEAT_TIMEOUT) {
                    // Still in grace period - assume connected to avoid warning flash
                    return true;
                }
            }
            // Grace period expired and no heartbeat received - not connected
            return false;
        }

        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatReceived;
        return timeSinceLastHeartbeat < HEARTBEAT_TIMEOUT;
    }

    /**
     * Start sending periodic heartbeat messages (admin mode only)
     * @returns {void}
     */
    private startHeartbeat(): void {
        if (!this.isAdminMode || !this.channel) {
            return;
        }

        // Send initial heartbeat immediately
        this.sendHeartbeat();

        // Set up periodic heartbeat
        this.heartbeatInterval = window.setInterval(() => {
            this.sendHeartbeat();
        }, HEARTBEAT_INTERVAL);

        console.log(
            `Admin heartbeat started (interval: ${HEARTBEAT_INTERVAL}ms)`
        );
    }

    /**
     * Stop sending heartbeat messages
     * @returns {void}
     */
    private stopHeartbeat(): void {
        if (this.heartbeatInterval !== null) {
            window.clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
            console.log("Admin heartbeat stopped");
        }
    }

    /**
     * Send a heartbeat message to viewer windows
     * @returns {void}
     */
    private sendHeartbeat(): void {
        if (!this.channel) {
            return;
        }

        const message: RefreshMessage = {
            type: RefreshMessageType.HEARTBEAT,
            timestamp: Date.now(),
            source: this.isAdminMode ? WindowMode.ADMIN : WindowMode.VIEWER,
        };

        try {
            this.channel.postMessage(message);
        } catch (error) {
            console.error("Failed to send heartbeat:", error);
        }
    }

    /**
     * Get the current configuration
     * @returns {RefreshConfig} Current configuration
     */
    public getConfig(): RefreshConfig {
        return { ...this.config };
    }

    /**
     * Update the refresh delay
     * @param delay - New delay in milliseconds
     * @returns {void}
     */
    public setRefreshDelay(delay: number): void {
        if (delay < 0) {
            throw new Error("Refresh delay must be non-negative");
        }
        this.config.refreshDelay = delay;
    }

    /**
     * Clean up resources when the manager is no longer needed
     * @returns {void}
     */
    public destroy(): void {
        // Stop heartbeat if running
        this.stopHeartbeat();

        if (this.channel) {
            try {
                this.channel.close();
                this.channel = null;
                console.log("WindowRefreshManager destroyed");
            } catch (error) {
                console.error("Error destroying WindowRefreshManager:", error);
            }
        }
    }
}

/**
 * Create and return a singleton instance of WindowRefreshManager
 * @param config - Optional configuration overrides
 * @returns {WindowRefreshManager} Singleton instance
 */
let refreshManagerInstance: WindowRefreshManager | null = null;

export function getWindowRefreshManager(
    config?: Partial<RefreshConfig>
): WindowRefreshManager {
    if (!refreshManagerInstance) {
        refreshManagerInstance = new WindowRefreshManager(config);
    }
    return refreshManagerInstance;
}

/**
 * Convenience function to notify that configuration has been saved
 * @returns {void}
 */
export function notifyConfigurationSaved(): void {
    const manager = getWindowRefreshManager();
    manager.notifyConfigurationSaved();
}

/**
 * Convenience function to notify viewer windows only (no admin refresh)
 * @returns {void}
 */
export function notifyConfigurationSavedViewerOnly(): void {
    const manager = getWindowRefreshManager();
    manager.notifyConfigurationSavedViewerOnly();
}

/**
 * Convenience function to notify that challenge state has changed
 * @returns {void}
 */
export function notifyChallengeStateChanged(): void {
    const manager = getWindowRefreshManager();
    manager.notifyChallengeStateChanged();
}

/**
 * Convenience function to check if the refresh system is available
 * @returns {boolean} True if the system is available
 */
export function isRefreshSystemAvailable(): boolean {
    const manager = getWindowRefreshManager();
    return manager.isAvailable();
}

/**
 * Convenience function to check if there is an active connection to the admin panel
 * @returns {boolean} True if connected to admin panel or in admin mode
 */
export function isAdminPanelConnected(): boolean {
    const manager = getWindowRefreshManager();
    return manager.isConnected();
}
