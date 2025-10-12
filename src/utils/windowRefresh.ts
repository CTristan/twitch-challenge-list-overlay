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
 * @class WindowRefreshManager
 * Manages BroadcastChannel communication for automatic window refresh
 * when configuration changes are saved.
 */
export class WindowRefreshManager {
    private channel: BroadcastChannel | null = null;
    private config: RefreshConfig;
    private isAdminMode: boolean;

    /**
     * @constructor
     * @param config - Optional configuration overrides
     */
    constructor(config: Partial<RefreshConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.isAdminMode = window.location.hash === URL_HASH.ADMIN;
        this.initializeBroadcastChannel();
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
