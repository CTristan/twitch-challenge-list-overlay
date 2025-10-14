import {
    CSS_CLASSES,
    CSS_SELECTORS,
    ELEMENT_IDS,
    HTML_ELEMENTS,
} from "../types/DOMConstants";
import { ADMIN_PANEL_LABELS, ERROR_MESSAGES } from "../types/MessageConstants";
import { STORAGE_KEYS } from "../types/StorageConstants";
import { AdminPanelDOMBuilder } from "./AdminPanelDOMBuilder";
import CollapsibleSection from "./CollapsibleSection";

/**
 * Utility class for building admin panel sections
 * Handles creation of configuration form and collapsible sections
 */
export class AdminPanelSectionBuilder {
    /**
     * Create the configuration form HTML with collapsible sections
     * @param collapsibleSectionsMap - Map to store collapsible section instances
     * @returns {void}
     */
    static createConfigurationForm(
        collapsibleSectionsMap: Map<string, CollapsibleSection>
    ): void {
        const adminContent = document.querySelector(
            CSS_SELECTORS.ADMIN_CONTENT
        ) as HTMLElement;
        if (!adminContent) {
            return;
        }

        // Check if form already exists
        if (document.getElementById(ELEMENT_IDS.CONFIG_FORM)) {
            return;
        }

        // Create the main form container
        const formContainer = document.createElement(HTML_ELEMENTS.DIV);
        formContainer.id = ELEMENT_IDS.CONFIG_FORM;
        formContainer.className = CSS_CLASSES.CONFIG_FORM;

        // Create collapsible sections in desired order
        AdminPanelSectionBuilder.createBehaviorSection(
            formContainer,
            collapsibleSectionsMap
        );
        AdminPanelSectionBuilder.createChallengeRowStylingSection(
            formContainer,
            collapsibleSectionsMap
        );
        AdminPanelSectionBuilder.createOverlayBackgroundSection(
            formContainer,
            collapsibleSectionsMap
        );
        AdminPanelSectionBuilder.createAuthenticationSection(
            formContainer,
            collapsibleSectionsMap
        );

        adminContent.appendChild(formContainer);

        // Add action buttons at the bottom of the admin panel (outside the form)
        AdminPanelSectionBuilder.createBottomActionButtons(adminContent);
    }

    /**
     * Create the Authentication section
     * @param container - The parent container element
     * @param collapsibleSectionsMap - Map to store collapsible section instances
     */
    static createAuthenticationSection(
        container: HTMLElement,
        collapsibleSectionsMap: Map<string, CollapsibleSection>
    ): void {
        const authContent = AdminPanelDOMBuilder.createAuthenticationSection();

        try {
            const authSection = new CollapsibleSection({
                id: ELEMENT_IDS.AUTHENTICATION_SECTION,
                title: ADMIN_PANEL_LABELS.AUTHENTICATION_SETTINGS,
                content: authContent,
                defaultExpanded: false,
                storageKey: STORAGE_KEYS.AUTHENTICATION_SECTION_COLLAPSED,
            });

            collapsibleSectionsMap.set(
                ELEMENT_IDS.AUTHENTICATION_SECTION,
                authSection
            );
            const element = authSection.createElement();
            container.appendChild(element);
        } catch (error) {
            console.error(
                ERROR_MESSAGES.ERROR_CREATING_COLLAPSIBLE_SECTION,
                error
            );
            // Fallback to old HTML structure
            const fallbackHTML = `
                <${HTML_ELEMENTS.DIV} class="${CSS_CLASSES.CONFIG_SECTION}">
                  <${HTML_ELEMENTS.H4}>${ADMIN_PANEL_LABELS.AUTHENTICATION}</${HTML_ELEMENTS.H4}>
                  ${authContent}
                </${HTML_ELEMENTS.DIV}>
            `;
            container.innerHTML += fallbackHTML;
        }
    }

    /**
     * Create the Behavior Settings section
     * @param container - The parent container element
     * @param collapsibleSectionsMap - Map to store collapsible section instances
     */
    static createBehaviorSection(
        container: HTMLElement,
        collapsibleSectionsMap: Map<string, CollapsibleSection>
    ): void {
        const behaviorContent = AdminPanelDOMBuilder.createBehaviorSection();

        const behaviorSection = new CollapsibleSection({
            id: ELEMENT_IDS.BEHAVIOR_SECTION,
            title: ADMIN_PANEL_LABELS.BEHAVIOR_SETTINGS,
            content: behaviorContent,
            defaultExpanded: false,
            storageKey: STORAGE_KEYS.BEHAVIOR_SECTION_COLLAPSED,
        });

        collapsibleSectionsMap.set(
            ELEMENT_IDS.BEHAVIOR_SECTION,
            behaviorSection
        );
        container.appendChild(behaviorSection.createElement());
    }

    /**
     * Create the Challenge Row Styling section
     * Combines tier-based color configuration with default challenge row background settings
     * @param container - The parent container element
     * @param collapsibleSectionsMap - Map to store collapsible section instances
     */
    static createChallengeRowStylingSection(
        container: HTMLElement,
        collapsibleSectionsMap: Map<string, CollapsibleSection>
    ): void {
        const challengeRowStylingContent =
            AdminPanelDOMBuilder.createChallengeRowStylingSection();

        const challengeRowStylingSection = new CollapsibleSection({
            id: ELEMENT_IDS.CHALLENGE_ROW_STYLING_SECTION,
            title: ADMIN_PANEL_LABELS.CHALLENGE_ROW_STYLING,
            content: challengeRowStylingContent,
            defaultExpanded: false,
            storageKey: STORAGE_KEYS.CHALLENGE_ROW_STYLING_SECTION_COLLAPSED,
        });

        collapsibleSectionsMap.set(
            ELEMENT_IDS.CHALLENGE_ROW_STYLING_SECTION,
            challengeRowStylingSection
        );
        container.appendChild(challengeRowStylingSection.createElement());
    }

    /**
     * Create the Overlay Background section
     * Controls the main container background behind all challenges
     * @param container - The parent container element
     * @param collapsibleSectionsMap - Map to store collapsible section instances
     */
    static createOverlayBackgroundSection(
        container: HTMLElement,
        collapsibleSectionsMap: Map<string, CollapsibleSection>
    ): void {
        const overlayBackgroundContent =
            AdminPanelDOMBuilder.createOverlayBackgroundSection();

        const overlayBackgroundSection = new CollapsibleSection({
            id: ELEMENT_IDS.OVERLAY_BACKGROUND_SECTION,
            title: ADMIN_PANEL_LABELS.OVERLAY_BACKGROUND,
            content: overlayBackgroundContent,
            defaultExpanded: false,
            storageKey: STORAGE_KEYS.OVERLAY_BACKGROUND_SECTION_COLLAPSED,
        });

        collapsibleSectionsMap.set(
            ELEMENT_IDS.OVERLAY_BACKGROUND_SECTION,
            overlayBackgroundSection
        );
        container.appendChild(overlayBackgroundSection.createElement());
    }

    /**
     * Create action buttons at the bottom of the admin panel
     * Includes configuration actions and danger zone buttons
     * @param container - The parent container element (admin-content)
     */
    static createBottomActionButtons(container: HTMLElement): void {
        const buttonContainer =
            AdminPanelDOMBuilder.createBottomActionButtons();
        container.appendChild(buttonContainer);
    }
}
