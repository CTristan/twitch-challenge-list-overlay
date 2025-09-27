import type { UIUpdateData } from "./UIUpdateData";

/**
 * Response from command processing
 * Contains the result message and metadata about the operation
 */
export interface CommandResponse {
    /** Response message to send to chat */
    message: string;
    /** Whether an error occurred */
    error: boolean;
    /** Structured UI update data */
    uiUpdate?: UIUpdateData;
}
