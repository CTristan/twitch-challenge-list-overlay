import { AdminPanelTemplates } from "../templates/AdminPanelTemplates";
import { DEFAULT_COLORS } from "../types/ColorConstants";
import { ELEMENT_IDS } from "../types/DOMConstants";

/**
 * Utility class for building DOM elements for the admin panel
 * Handles section creation and HTML generation
 */
export class AdminPanelDOMBuilder {
    /**
     * Create authentication section HTML
     * @returns HTML string for authentication section
     */
    static createAuthenticationSection(): string {
        return `
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_OAUTH}">Twitch OAuth Token:</label>
            <input
              type="password"
              id="${ELEMENT_IDS.TWITCH_OAUTH}"
              placeholder="oauth:your_token_here"
              autocomplete="off"
            />
            <small>Generate at <a href="https://twitchtokengenerator.com" target="_blank">twitchtokengenerator.com</a></small>
          </div>
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_USERNAME}">Bot Username:</label>
            <input
              type="text"
              id="${ELEMENT_IDS.TWITCH_USERNAME}"
              placeholder="your_bot_username"
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label for="${ELEMENT_IDS.TWITCH_CHANNEL}">Channel Name:</label>
            <input
              type="text"
              id="${ELEMENT_IDS.TWITCH_CHANNEL}"
              placeholder="channel_to_join"
              autocomplete="off"
            />
          </div>
        `;
    }

    /**
     * Create behavior section HTML
     * @returns HTML string for behavior section
     */
    static createBehaviorSection(): string {
        return `
          <div class="form-group">
            <label for="${ELEMENT_IDS.MAX_CHALLENGES}">Max Challenges:</label>
            <input
              type="number"
              id="${ELEMENT_IDS.MAX_CHALLENGES}"
              min="1"
              max="100"
              value="10"
            />
            <small>Maximum number of active challenges (1-100)</small>
          </div>
        `;
    }

    /**
     * Create challenge row styling section HTML
     * Combines tier-based colors and default challenge row background settings
     * @returns HTML string for challenge row styling section
     */
    static createChallengeRowStylingSection(): string {
        return AdminPanelTemplates.challengeRowStylingSection({
            primaryBackgroundColor: DEFAULT_COLORS.PRIMARY_BACKGROUND,
            primaryTextColor: DEFAULT_COLORS.PRIMARY_TEXT,
            secondaryBackgroundColor: DEFAULT_COLORS.SECONDARY_BACKGROUND,
            secondaryTextColor: DEFAULT_COLORS.SECONDARY_TEXT,
            tertiaryBackgroundColor: DEFAULT_COLORS.TERTIARY_BACKGROUND,
            tertiaryTextColor: DEFAULT_COLORS.TERTIARY_TEXT,
            rowColorsOpacityPercent: 100,
            challengeBackgroundColor: DEFAULT_COLORS.CHALLENGE_BACKGROUND,
            challengeTextColor: DEFAULT_COLORS.WHITE_TEXT,
            elementIds: ELEMENT_IDS,
        });
    }

    /**
     * Create overlay background section HTML
     * Controls the main container background behind all challenges
     * @returns HTML string for overlay background section
     */
    static createOverlayBackgroundSection(): string {
        return AdminPanelTemplates.overlayBackgroundSection({
            overlayBackgroundColor: DEFAULT_COLORS.CHALLENGE_BACKGROUND,
            elementIds: ELEMENT_IDS,
        });
    }

    /**
     * Create actions section HTML
     * @returns HTML string for actions section
     */
    static createActionsSection(): string {
        return `
          <div class="config-actions">
            <button id="${ELEMENT_IDS.EXPORT_JSON_BTN}" class="admin-button primary">Backup Configuration</button>
            <button id="${ELEMENT_IDS.IMPORT_CONFIG_BTN}" class="admin-button secondary">Restore Configuration</button>
            <button id="${ELEMENT_IDS.RESET_CONFIG_BTN}" class="admin-button secondary">Reset to Defaults</button>
          </div>
        `;
    }

    /**
     * Create danger zone section HTML
     * @returns HTML string for danger zone section
     */
    static createDangerZoneSection(): string {
        return `
          <p class="danger-warning">The action below will permanently delete all stored configuration data. This cannot be undone.</p>
          <div class="danger-actions">
            <button id="${ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN}" class="admin-button danger">Clear All Data</button>
          </div>
        `;
    }
}
