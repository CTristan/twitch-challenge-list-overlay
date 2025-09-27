import type Challenge from "../classes/Challenge";
import type { UIUpdateAction } from "./UIUpdateAction";

/**
 * UI Update Data
 * Contains structured information about what UI updates need to be performed
 */
export interface UIUpdateData {
    /** Type of UI update to perform */
    action: UIUpdateAction;
    /** Challenge indices for operations that affect specific challenges */
    challengeIndices?: number[];
    /** Challenge objects for operations that need full challenge data */
    challenges?: Challenge[];
    /** Whether to update timer displays */
    updateTimers?: boolean;
    /** Whether to update challenge count */
    updateCount?: boolean;
    /** Additional metadata for the update */
    metadata?: Record<string, any>;
}
