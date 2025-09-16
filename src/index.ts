import App from "./app";
import AdminPanel from "./classes/AdminPanel";
import ConfigManager from "./classes/ConfigManager";
import { setupDualWindow } from "./dualWindow";
import { closeModal, openModal } from "./modal";
import TwitchChat from "./twitch/TwitchChat";
import { loadTestUsers } from "./twitch/loadTestUsers";
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
    console.error("Failed to initialize ConfigManager, using fallback:", error);
    // Create a new instance with the fallback config
    configManager = ConfigManager.getInstance(_config);
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

    // Initialize admin panel functionality
    new AdminPanel();

    client.on("command", (data: CommandData) => {
        const { user, command, message, flags, extra } = data;
        const response = app.chatHandler(user, command, message, flags, extra);
        if (!response.error) {
            client.say(response.message, extra.messageId);
        } else {
            // error logs also are added to OBS logs
            console.error(response.message);
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
});
