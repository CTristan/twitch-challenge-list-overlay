/**
 * Window Refresh Communication Module
 * 
 * Handles BroadcastChannel communication for automatic window refresh
 * functionality when configuration changes are saved in the admin panel.
 * 
 * @module windowRefresh
 */

/**
 * Message types for BroadcastChannel communication
 */
export interface RefreshMessage {
  type: 'config-saved';
  timestamp: number;
  source: 'admin' | 'viewer';
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
  channelName: 'twitch-overlay-config-updates',
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
    this.isAdminMode = window.location.hash === '#admin';
    this.initializeBroadcastChannel();
  }

  /**
   * Initialize the BroadcastChannel for inter-window communication
   * @returns {void}
   */
  private initializeBroadcastChannel(): void {
    try {
      // Check if BroadcastChannel is supported
      if (typeof BroadcastChannel === 'undefined') {
        console.warn('BroadcastChannel is not supported in this environment');
        return;
      }

      this.channel = new BroadcastChannel(this.config.channelName);
      this.setupMessageListener();
      
      console.log(`WindowRefreshManager initialized for ${this.isAdminMode ? 'admin' : 'viewer'} mode`);
    } catch (error) {
      console.error('Failed to initialize BroadcastChannel:', error);
    }
  }

  /**
   * Set up message listener for BroadcastChannel
   * @returns {void}
   */
  private setupMessageListener(): void {
    if (!this.channel) return;

    this.channel.addEventListener('message', (event: MessageEvent<RefreshMessage>) => {
      const { type, timestamp, source } = event.data;

      // Validate message structure
      if (type !== 'config-saved' || !timestamp || !source) {
        console.warn('Invalid refresh message received:', event.data);
        return;
      }

      // Ignore messages from the same window type to prevent loops
      const currentSource = this.isAdminMode ? 'admin' : 'viewer';
      if (source === currentSource) {
        return;
      }

      console.log(`Received config-saved message from ${source} window, refreshing...`);
      this.performRefresh();
    });
  }

  /**
   * Send a configuration saved message to other windows
   * @returns {void}
   */
  public notifyConfigurationSaved(): void {
    if (!this.channel) {
      console.warn('BroadcastChannel not available, cannot notify other windows');
      return;
    }

    const message: RefreshMessage = {
      type: 'config-saved',
      timestamp: Date.now(),
      source: this.isAdminMode ? 'admin' : 'viewer',
    };

    try {
      this.channel.postMessage(message);
      console.log('Configuration saved notification sent to other windows');
      
      // Also refresh the current window after a short delay
      setTimeout(() => {
        this.performRefresh();
      }, this.config.refreshDelay);
    } catch (error) {
      console.error('Failed to send configuration saved notification:', error);
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
        console.log('Refreshing window to apply configuration changes...');
        window.location.reload();
      }, this.config.refreshDelay);
    } catch (error) {
      console.error('Failed to refresh window:', error);
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
      throw new Error('Refresh delay must be non-negative');
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
        console.log('WindowRefreshManager destroyed');
      } catch (error) {
        console.error('Error destroying WindowRefreshManager:', error);
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

export function getWindowRefreshManager(config?: Partial<RefreshConfig>): WindowRefreshManager {
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
 * Convenience function to check if the refresh system is available
 * @returns {boolean} True if the system is available
 */
export function isRefreshSystemAvailable(): boolean {
  const manager = getWindowRefreshManager();
  return manager.isAvailable();
}
