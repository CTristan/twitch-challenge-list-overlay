import { ELEMENT_IDS } from "../types/DOMConstants";

/**
 * Template parameters interface for overlay background section
 */
export interface OverlayBackgroundSectionParams {
    overlayBackgroundColor: string;
    elementIds: typeof ELEMENT_IDS;
}

/**
 * Template parameters interface for challenge row styling section
 * Combines tier-based colors and default challenge row background settings
 */
export interface ChallengeRowStylingSectionParams {
    primaryBackgroundColor: string;
    primaryTextColor: string;
    secondaryBackgroundColor: string;
    secondaryTextColor: string;
    tertiaryBackgroundColor: string;
    tertiaryTextColor: string;
    rowColorsOpacityPercent: number;
    challengeBackgroundColor: string;
    challengeTextColor: string;
    elementIds: typeof ELEMENT_IDS;
}

/**
 * @class AdminPanelTemplates
 * HTML templates for admin panel sections to improve code readability,
 * maintainability, and separation of concerns.
 *
 * Templates are organized by functionality and use parameter objects
 * for dynamic content injection while maintaining type safety.
 */
export const AdminPanelTemplates = {
    /**
     * Challenge row styling section template
     * Combines tier-based color configuration with default challenge row background settings
     * @param params - Template parameters for dynamic content
     * @returns HTML string for the challenge row styling section
     */
    challengeRowStylingSection: (
        params: ChallengeRowStylingSectionParams
    ): string => `
          <div class="form-group">
            <p class="form-description">Configure styling for individual challenge containers using tier-based colors.</p>

            <!-- Tier-Based Color Configuration -->
            <h5 class="subsection-title">Tier-Based Colors</h5>
            <p class="help-text">Primary color is always active and serves as the default. Secondary and Tertiary colors are optional overrides.</p>

            <!-- Primary Color Configuration (Always Enabled) -->
            <div class="color-tier-section" id="primary-color-section">
              <div class="color-tier-header">
                <h5 class="color-tier-title">Primary Color (Default)</h5>
              </div>
              <div class="color-pickers-container expanded" id="primary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="primary-bg-color" class="form-input" value="${params.primaryBackgroundColor}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="primary-text-color" class="form-input" value="${params.primaryTextColor}">
                </div>
              </div>
            </div>

            <!-- Secondary Color Configuration (Optional) -->
            <div class="color-tier-section" id="secondary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="secondary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Secondary Color (Optional)</h5>
              </div>
              <div class="color-pickers-container" id="secondary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="secondary-bg-color" class="form-input" value="${params.secondaryBackgroundColor}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="secondary-text-color" class="form-input" value="${params.secondaryTextColor}">
                </div>
              </div>
            </div>

            <!-- Tertiary Color Configuration (Optional) -->
            <div class="color-tier-section" id="tertiary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="tertiary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Tertiary Color (Optional)</h5>
              </div>
              <div class="color-pickers-container" id="tertiary-color-pickers">
                <div class="color-picker-group">
                  <label class="color-picker-label">Row Background</label>
                  <input type="color" id="tertiary-bg-color" class="form-input" value="${params.tertiaryBackgroundColor}">
                </div>
                <div class="color-picker-group">
                  <label class="color-picker-label">Text Color</label>
                  <input type="color" id="tertiary-text-color" class="form-input" value="${params.tertiaryTextColor}">
                </div>
              </div>
            </div>

            <!-- Text Readability Configuration -->
            <div class="text-readability-section" style="margin-top: 1rem;">
              <h5 class="subsection-title">Text Readability</h5>

              <div class="form-row">
                <div class="checkbox-group">
                  <input type="checkbox" id="challenge-auto-text-color" class="form-checkbox" checked>
                  <label for="challenge-auto-text-color" class="checkbox-label">
                    Automatic text color adjustment
                    <span class="help-text">Automatically choose white or black text for optimal readability</span>
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-column">
                  <label class="form-label">Manual Text Color Override</label>
                  <input type="color" id="challenge-text-color" class="form-input color-input" value="${params.challengeTextColor}" disabled>
                  <span class="help-text">Used when automatic adjustment is disabled</span>
                </div>
              </div>

              <div class="form-row">
                <div class="checkbox-group">
                  <input type="checkbox" id="challenge-text-shadow" class="form-checkbox" checked>
                  <label for="challenge-text-shadow" class="checkbox-label">
                    Enhanced text readability
                    <span class="help-text">Add text shadows/outlines for better visibility on various backgrounds</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Preview Section -->
            <div class="background-preview-section" style="margin-top: 1rem;">
              <h5 class="subsection-title">Preview</h5>
              <div id="background-preview" class="background-preview">
                <div class="preview-challenge">
                  <div class="preview-checkbox"></div>
                  <div class="preview-text">
                    <div class="preview-title">Sample Challenge</div>
                    <div class="preview-description">This is how your challenges will look</div>
                    <div class="preview-progress">Progress: 3/5</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tier Colors Opacity Control -->
            <div class="form-row" style="margin-top: 1rem;">
              <div class="form-column">
                <label class="form-label">Tier Colors Opacity (%)</label>
                <div class="opacity-control">
                  <input type="range" id="row-colors-opacity" class="form-input opacity-slider"
                         min="0" max="100" value="${params.rowColorsOpacityPercent}" step="5">
                  <span id="row-colors-opacity-display" class="opacity-value">${params.rowColorsOpacityPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        `,

    /**
     * Overlay background section template
     * Controls the main container background behind all challenges
     * @param params - Template parameters for dynamic content
     * @returns HTML string for the overlay background section
     */
    overlayBackgroundSection: (
        params: OverlayBackgroundSectionParams
    ): string => `
          <div class="form-group">
            <p class="form-description">Controls the main container background behind all challenges.</p>

            <div class="form-row">
              <div class="form-column">
                <label class="form-label">Background Color</label>
                <input type="color" id="overlay-background-color" class="form-input color-input" value="${params.overlayBackgroundColor}">
              </div>
              <div class="form-column">
                <label class="form-label">Opacity (%)</label>
                <div class="opacity-control">
                  <input type="range" id="overlay-background-opacity" class="form-input opacity-slider"
                         min="0" max="100" value="60" step="5">
                  <span id="overlay-opacity-display" class="opacity-value">60%</span>
                </div>
              </div>
            </div>
          </div>
        `,
} as const;
