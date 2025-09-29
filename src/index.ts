import App from "./app";
import AdminPanel from "./classes/AdminPanel";
import ConfigManager from "./classes/ConfigManager";
import { setupDualWindow } from "./dualWindow";
import { closeModal, openModal } from "./modal";
import TwitchChat from "./twitch/TwitchChat";
import { loadTestUsers } from "./twitch/loadTestUsers";
import { createFallbackConfig } from "./utils/ConfigDefaults";
import { getWindowRefreshManager } from "./utils/windowRefresh";

// Initialize dual-window architecture
setupDualWindow();

// Initialize window refresh system for configuration updates
getWindowRefreshManager();

// Initialize configuration management system
// Note: _config is loaded from _config.js via script tag in index.html
let configManager: ConfigManager;
try {
    configManager = ConfigManager.getInstance(_config);
} catch (error) {
    console.warn(
        "Failed to load configuration from _config.js, using minimal fallback configuration:",
        error
    );
    console.warn(
        "Please configure the application through the admin panel (#admin)"
    );

    // Create minimal default configuration for fallback
    const minimalConfig: Config = createFallbackConfig();

    // Create ConfigManager instance with minimal fallback configuration
    configManager = ConfigManager.getInstance(minimalConfig);
}

const twitch_channel = configManager.get("auth.twitch_channel");
const twitch_oauth = configManager.get("auth.twitch_oauth");
const twitch_username = configManager.get("auth.twitch_username");

const twitchIRC = "wss://irc-ws.chat.twitch.tv:443";
const client = new TwitchChat(twitchIRC, {
    username: twitch_username,
    authToken: twitch_oauth,
    channel: twitch_channel,
});

window.addEventListener("load", () => {
    let storeName = "challengeList";
    // Test mode can be enabled via URL parameter: ?test=true
    const urlParams = new URLSearchParams(window.location.search);
    const testMode = urlParams.get("test") === "true";

    if (testMode) {
        console.log("Test mode enabled");
        storeName = "testChallengeList";
    }

    const app = new App(storeName);
    app.render();

    // Initialize admin panel functionality with App instance for interactive features
    new AdminPanel(app);

    client.on("command", (data: CommandData) => {
        const { user, command, message, flags, extra } = data;

        const response = app.chatHandler(user, command, message, flags, extra);

        if (!response.error) {
            client.say(response.message, extra.messageId);
        } else {
            // error logs also are added to OBS logs
            if (response.message) {
                console.error(`[CommandHandler] Error: ${response.message}`);
            }
            // Note: Silent ignores (empty error messages) are not logged here to avoid spam
        }
    });

    client.on("oauthError", () => {
        openModal();
    });

    client.on("oauthSuccess", () => {
        closeModal();
    });

    client.connect();
    if (testMode) loadTestUsers(client);

    // Expose components globally for debugging
    (window as any).challengeBot = {
        app,
        client,
        configManager,
        version: "1.0.0",
    };
});
