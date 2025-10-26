import { AdminPanelTemplates } from "../templates/AdminPanelTemplates";
import { DEFAULT_COLORS } from "../types/ColorConstants";
import { BACKGROUND_DEFAULTS } from "../types/ConfigConstants";
import { ELEMENT_IDS } from "../types/DOMConstants";
import { FONT_SIZE_CONSTANTS } from "../types/NumericConstants";

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
     * Create general settings section HTML
     * @returns HTML string for general settings section
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
          <div class="form-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                id="${ELEMENT_IDS.ADMIN_TEXT_ONLY_MODE}"
              />
              <span>Text-Only Mode in Admin View</span>
            </label>
            <small>When enabled, icons become text buttons in admin view (viewer overlay remains unchanged)</small>
          </div>
        `;
    }

    /**
     * Create challenge row styling section HTML
     * Combines tier-based colors and default challenge row background settings
     * @returns HTML string for challenge row styling section
     */
    static createChallengeRowStylingSection(): string {
        const viewerFontSizePercent =
            BACKGROUND_DEFAULTS.VIEWER_CHALLENGE_FONT_SIZE;
        const viewerFontSizeDisplay = formatFontSizeDisplay(
            viewerFontSizePercent
        );

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
            viewerFontSizePercent,
            viewerFontSizeDisplay,
            viewerFontSizeMinPercent: FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MIN,
            viewerFontSizeMaxPercent: FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MAX,
            viewerFontSizeStepPercent: FONT_SIZE_CONSTANTS.VIEWER_PERCENT_STEP,
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
     * Create bottom action buttons section (outside collapsible sections)
     * Includes configuration actions and danger zone buttons
     * @returns HTMLElement containing all action buttons
     */
    static createBottomActionButtons(): HTMLElement {
        const container = document.createElement("div");
        container.className = "bottom-action-buttons";

        // Configuration actions section
        const actionsSection = document.createElement("div");
        actionsSection.className = "config-actions";

        const backupBtn = document.createElement("button");
        backupBtn.id = ELEMENT_IDS.EXPORT_JSON_BTN;
        backupBtn.className = "admin-button primary";
        backupBtn.textContent = "Backup Configuration";

        const restoreBtn = document.createElement("button");
        restoreBtn.id = ELEMENT_IDS.IMPORT_CONFIG_BTN;
        restoreBtn.className = "admin-button secondary";
        restoreBtn.textContent = "Restore Configuration";

        // Hidden file input for import functionality
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.id = ELEMENT_IDS.IMPORT_FILE_INPUT;
        fileInput.accept = ".json";
        fileInput.style.display = "none";

        actionsSection.appendChild(backupBtn);
        actionsSection.appendChild(restoreBtn);
        actionsSection.appendChild(fileInput);

        // Reset section
        const resetSection = document.createElement("div");
        resetSection.className = "reset-section";

        const resetNote = document.createElement("p");
        resetNote.className = "reset-note";
        resetNote.textContent =
            "Reset the challenge overlay configuration back to default values.";

        const resetActions = document.createElement("div");
        resetActions.className = "reset-actions";

        const resetBtn = document.createElement("button");
        resetBtn.id = ELEMENT_IDS.RESET_CONFIG_BTN;
        resetBtn.className = "admin-button secondary";
        resetBtn.textContent = "Reset to Defaults";

        resetActions.appendChild(resetBtn);
        resetSection.appendChild(resetNote);
        resetSection.appendChild(resetActions);

        // Danger zone section
        const dangerSection = document.createElement("div");
        dangerSection.className = "danger-zone-section";

        const dangerWarning = document.createElement("p");
        dangerWarning.className = "danger-warning";
        dangerWarning.textContent =
            "The action below will permanently delete all stored configuration data. This cannot be undone.";

        const dangerActions = document.createElement("div");
        dangerActions.className = "danger-actions";

        const clearBtn = document.createElement("button");
        clearBtn.id = ELEMENT_IDS.CLEAR_LOCALSTORAGE_BTN;
        clearBtn.className = "admin-button danger";
        clearBtn.textContent = "Clear All Data";

        dangerActions.appendChild(clearBtn);
        dangerSection.appendChild(dangerWarning);
        dangerSection.appendChild(dangerActions);

        // Add both sections to container
        container.appendChild(actionsSection);
        container.appendChild(resetSection);
        container.appendChild(dangerSection);

        return container;
    }
}

function formatFontSizeDisplay(percent: number): string {
    const clampedPercent = Math.min(
        Math.max(percent, FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MIN),
        FONT_SIZE_CONSTANTS.VIEWER_PERCENT_MAX
    );
    const formattedPercent = clampedPercent.toFixed(1).replace(/\.0$/, "");
    return `${formattedPercent}%`;
}
