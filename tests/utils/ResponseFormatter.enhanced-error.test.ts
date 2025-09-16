import { describe, expect, it } from "vitest";
import { ResponseFormatter } from "../../src/utils/ResponseFormatter";

describe("ResponseFormatter Enhanced Error Handling", () => {
    describe("formatError with unknown error types", () => {
        it("should handle Error objects with name and message", () => {
            const error = new Error("Something went wrong");
            error.name = "ValidationError";

            const result = ResponseFormatter.formatError(error, "testing");
            expect(result).toBe(
                "Error testing [ValidationError]: Something went wrong"
            );
        });

        it("should handle Error objects with error codes", () => {
            const error = new Error("Network timeout") as Error & {
                code: string;
            };
            error.code = "TIMEOUT";
            error.name = "NetworkError";

            const result = ResponseFormatter.formatError(error, "connecting");
            expect(result).toBe(
                "Error connecting [NetworkError]: Network timeout"
            );
        });

        it("should handle string errors", () => {
            const error = "Simple string error";

            const result = ResponseFormatter.formatError(error, "processing");
            expect(result).toBe("Error processing: Simple string error");
        });

        it("should handle object errors with JSON serialization", () => {
            const error = {
                type: "custom",
                message: "Custom error object",
                code: 500,
            };

            const result = ResponseFormatter.formatError(error, "parsing");
            expect(result).toBe(
                'Error parsing [UnknownError]: {"type":"custom","message":"Custom error object","code":500}'
            );
        });

        it("should handle non-serializable objects gracefully", () => {
            const circular: any = {};
            circular.self = circular; // Create circular reference

            const result = ResponseFormatter.formatError(
                circular,
                "serializing"
            );
            expect(result).toBe(
                "Error serializing [UnknownError]: [object Object]"
            );
        });

        it("should handle null and undefined errors", () => {
            const nullResult = ResponseFormatter.formatError(null, "null test");
            expect(nullResult).toBe("Error null test [UnknownError]: null");

            const undefinedResult = ResponseFormatter.formatError(
                undefined,
                "undefined test"
            );
            expect(undefinedResult).toBe(
                "Error undefined test [UnknownError]: undefined"
            );
        });

        it("should handle errors without context", () => {
            const error = new Error("No context error");

            const result = ResponseFormatter.formatError(error);
            expect(result).toBe("Error: No context error");
        });

        it("should handle Error objects with standard Error name", () => {
            const error = new Error("Standard error");
            // Don't override name, should use default "Error"

            const result = ResponseFormatter.formatError(error, "standard");
            expect(result).toBe("Error standard: Standard error");
        });

        it("should preserve error information for debugging", () => {
            const error = new Error("Debug info test");
            error.name = "DebugError";
            error.stack = "Error: Debug info test\n    at test.js:1:1";

            // The formatError method should preserve the error information internally
            // even though it only returns the formatted message
            const result = ResponseFormatter.formatError(error, "debugging");
            expect(result).toBe(
                "Error debugging [DebugError]: Debug info test"
            );
        });
    });

    describe("backward compatibility", () => {
        it("should maintain compatibility with existing error handling patterns", () => {
            // Test that the new formatError method works with existing patterns
            const stringError = "Legacy string error";
            const errorObject = new Error("Legacy error object");

            const stringResult = ResponseFormatter.formatError(
                stringError,
                "legacy"
            );
            const objectResult = ResponseFormatter.formatError(
                errorObject,
                "legacy"
            );

            expect(stringResult).toBe("Error legacy: Legacy string error");
            expect(objectResult).toBe("Error legacy: Legacy error object");
        });
    });
});
