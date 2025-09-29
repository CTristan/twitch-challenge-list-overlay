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
 * @class AdminPanelTemplates
 * HTML templates for admin panel sections to improve code readability,
 * maintainability, and separation of concerns.
 *
 * Templates are organized by functionality and use parameter objects
 * for dynamic content injection while maintaining type safety.
 */
export const AdminPanelTemplates = {
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
