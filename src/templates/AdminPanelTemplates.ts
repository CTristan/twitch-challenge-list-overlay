import { ELEMENT_IDS } from "../types/DOMConstants";

/**
 * Template parameters interface for background section
 */
export interface BackgroundSectionParams {
    overlayBackgroundColor: string;
    challengeBackgroundColor: string;
    challengeTextColor: string;
    elementIds: typeof ELEMENT_IDS;
}

/**
 * Template parameters interface for color section
 */
export interface ColorSectionParams {
    primaryBackgroundColor: string;
    primaryTextColor: string;
    secondaryBackgroundColor: string;
    secondaryTextColor: string;
    tertiaryBackgroundColor: string;
    tertiaryTextColor: string;
    rowColorsOpacityPercent: number;
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
     * Color configuration section template
     * @param params - Template parameters for dynamic content
     * @returns HTML string for the color section
     */
    colorSection: (params: ColorSectionParams): string => `
          <div class="form-group">
            <label>Challenge Row Colors:</label>

            <!-- Primary Color Configuration -->
            <div class="color-tier-section" id="primary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="primary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Primary Color</h5>
              </div>
              <div class="color-pickers-container" id="primary-color-pickers">
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

            <!-- Secondary Color Configuration -->
            <div class="color-tier-section" id="secondary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="secondary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Secondary Color</h5>
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

            <!-- Tertiary Color Configuration -->
            <div class="color-tier-section" id="tertiary-color-section">
              <div class="color-tier-header">
                <input type="checkbox" id="tertiary-color-enabled" class="color-tier-checkbox">
                <h5 class="color-tier-title">Tertiary Color</h5>
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

            <!-- Row Colors Opacity Control -->
            <div class="form-row" style="margin-top: 1rem;">
              <div class="form-column">
                <label class="form-label">Row Colors Opacity (%)</label>
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
     * Background customization section template
     * @param params - Template parameters for dynamic content
     * @returns HTML string for the background section
     */
    backgroundSection: (params: BackgroundSectionParams): string => `
          <div class="form-group">
            <label>Background Customization:</label>
            <p class="form-description">Configure background appearance for the overlay and individual challenge rows.</p>

            <!-- Overlay Background Configuration -->
            <div class="background-config-section">
              <h5 class="subsection-title">Overlay Background</h5>
              <p class="help-text">Controls the main container background behind all challenges</p>

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

              <div class="form-row">
                <div class="form-column">
                  <label class="form-label">App Background Opacity (%)</label>
                  <div class="opacity-control">
                    <input type="range" id="app-background-opacity" class="form-input opacity-slider"
                           min="0" max="100" value="0" step="5">
                    <span id="app-background-opacity-display" class="opacity-value">0%</span>
                  </div>
                  <p class="help-text" style="margin-top: 0.5rem; font-size: 0.9rem;">Controls the transparency of the main app container background (0% = fully transparent, 100% = fully opaque)</p>
                </div>
              </div>
            </div>

            <!-- Challenge Row Background Configuration -->
            <div class="background-config-section">
              <h5 class="subsection-title">Challenge Row Background</h5>
              <p class="help-text">Controls individual challenge container backgrounds. These settings apply to all challenges unless overridden by row-specific colors above.</p>

              <div class="form-row">
                <div class="form-column">
                  <label class="form-label">Background Color</label>
                  <input type="color" id="challenge-background-color" class="form-input color-input" value="${params.challengeBackgroundColor}">
                </div>
                <div class="form-column">
                  <label class="form-label">Opacity (%)</label>
                  <div class="opacity-control">
                    <input type="range" id="challenge-background-opacity" class="form-input opacity-slider"
                           min="0" max="100" value="70" step="5">
                    <span id="opacity-display" class="opacity-value">70%</span>
                  </div>
                </div>
              </div>

              <!-- Text Readability Configuration -->
              <div class="text-readability-section">
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
              <div class="background-preview-section">
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
            </div>
          </div>
        `,
} as const;
