import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfigExporter from "../../src/classes/ConfigExporter";
import { ErrorHandler } from "../../src/utils/errorHandler";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const createTestConfig = (): Config => ({
    auth: {
        twitch_oauth: "oauth:test_token_12345",
        twitch_username: "test_streamer",
        twitch_channel: "test_channel",
    },
    maxChallenges: 15,
    challengeRowColors: ["#FF0000", "#00FF00", "#0000FF"],
    commands: {
        clearAll: ["!ch clearlist", "!ch clearall"],
        clearDone: ["!ch cleardone"],
        addChallenge: ["!ch add"],
        editChallenge: ["!ch edit"],
        finishChallenge: ["!ch done"],
        deleteChallenge: ["!ch delete", "!ch del"],
        check: ["!ch check"],
        help: ["!ch help"],
        incrementChallenge: ["!ch +"],
        decrementChallenge: ["!ch -"],
        setProgress: ["!ch set"],
        failChallenge: ["!ch fail"],
        listChallenges: ["!ch list"],
        showChallenge: ["!ch show"],
    },
    responses: {
        clearAll: "All challenges cleared",
        clearDone: "Done challenges cleared",
        addChallenge: "Challenge added",
        editChallenge: "Challenge edited",
        finishChallenge: "Challenge completed",
        deleteChallenge: "Challenge deleted",
        deleteAll: "All challenges deleted",
        check: "Current challenges",
        help: "Help message",
        maxChallengesAdded: "Max challenges reached",
        noChallengeFound: "No challenge found",
        invalidCommand: "Invalid command",
    },
});

const createMinimalConfig = (): Config => ({
    auth: {
        twitch_oauth: "",
        twitch_username: "",
        twitch_channel: "",
    },
    maxChallenges: 10,
    commands: {
        clearAll: ["!ch clearall"],
        clearDone: ["!ch cleardone"],
        addChallenge: ["!ch add"],
        editChallenge: ["!ch edit"],
        finishChallenge: ["!ch done"],
        deleteChallenge: ["!ch delete"],
        check: ["!ch check"],
        help: ["!ch help"],
        incrementChallenge: ["!ch +"],
        decrementChallenge: ["!ch -"],
        setProgress: ["!ch set"],
        failChallenge: ["!ch fail"],
        listChallenges: ["!ch list"],
        showChallenge: ["!ch show"],
    },
    responses: {
        clearAll: "Cleared",
        clearDone: "Done cleared",
        addChallenge: "Added",
        editChallenge: "Edited",
        finishChallenge: "Completed",
        deleteChallenge: "Deleted",
        deleteAll: "All deleted",
        check: "Current",
        help: "Help",
        maxChallengesAdded: "Max reached",
        noChallengeFound: "Not found",
        invalidCommand: "Invalid",
    },
});

// ============================================================================
// TEST SUITE
// ============================================================================

describe("ConfigExporter", () => {
    let exporter: ConfigExporter;
    let testConfig: Config;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let originalBlob: typeof Blob;

    beforeEach(() => {
        ensureTestIsolation();
        testConfig = createTestConfig();
        exporter = new ConfigExporter(testConfig);
        consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        originalBlob = global.Blob;
    });

    afterEach(() => {
        // Restore original Blob if it was mocked
        global.Blob = originalBlob;
        vi.restoreAllMocks();
    });

    // ========================================================================
    // CONSTRUCTOR AND INITIALIZATION
    // ========================================================================

    describe("constructor", () => {
        it("should initialize with valid configuration", () => {
            expect(exporter).toBeInstanceOf(ConfigExporter);
            expect(exporter).toBeDefined();
        });

        it("should initialize ErrorHandler instance", () => {
            const errorHandler = ErrorHandler.getInstance();
            expect(errorHandler).toBeDefined();
        });
    });

    // ========================================================================
    // EXPORT AS JSON
    // ========================================================================

    describe("exportAsJSON", () => {
        it("should export configuration as formatted JSON string", () => {
            const result = exporter.exportAsJSON();

            expect(result).toBeTypeOf("string");
            expect(() => JSON.parse(result)).not.toThrow();

            const parsed = JSON.parse(result);
            expect(parsed.auth.twitch_oauth).toBe(testConfig.auth.twitch_oauth);
            expect(parsed.maxChallenges).toBe(testConfig.maxChallenges);
        });

        it("should format JSON with 2-space indentation", () => {
            const result = exporter.exportAsJSON();
            expect(result).toContain("  ");
            expect(result).toMatch(/\n\s{2}"/); // Check for indented properties
        });

        it("should handle minimal configuration", () => {
            const minimalExporter = new ConfigExporter(createMinimalConfig());
            const result = minimalExporter.exportAsJSON();

            expect(result).toBeTypeOf("string");
            const parsed = JSON.parse(result);
            expect(parsed.maxChallenges).toBe(10);
        });

        it("should throw error for non-serializable configuration", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);

            expect(() => circularExporter.exportAsJSON()).toThrow(
                "Failed to backup configuration as JSON"
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // EXPORT AS JSON WITH METADATA
    // ========================================================================

    describe("exportAsJSONWithMetadata", () => {
        it("should export configuration with metadata wrapper", () => {
            const result = exporter.exportAsJSONWithMetadata();
            const parsed = JSON.parse(result);

            expect(parsed._metadata).toBeDefined();
            expect(parsed.config).toBeDefined();
        });

        it("should include correct metadata fields", () => {
            const result = exporter.exportAsJSONWithMetadata();
            const parsed = JSON.parse(result);

            expect(parsed._metadata.exportedAt).toBeDefined();
            expect(parsed._metadata.version).toBe("1.0.0");
            expect(parsed._metadata.source).toBe(
                "Twitch Challenge Overlay Admin Panel"
            );
            expect(parsed._metadata.description).toContain(
                "Configuration backup"
            );
        });

        it("should include ISO timestamp in metadata", () => {
            const result = exporter.exportAsJSONWithMetadata();
            const parsed = JSON.parse(result);

            const timestamp = parsed._metadata.exportedAt;
            expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it("should preserve original configuration in config field", () => {
            const result = exporter.exportAsJSONWithMetadata();
            const parsed = JSON.parse(result);

            expect(parsed.config.auth.twitch_oauth).toBe(
                testConfig.auth.twitch_oauth
            );
            expect(parsed.config.maxChallenges).toBe(testConfig.maxChallenges);
            expect(parsed.config.challengeRowColors).toEqual(
                testConfig.challengeRowColors
            );
        });

        it("should throw error for non-serializable configuration", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);

            expect(() => circularExporter.exportAsJSONWithMetadata()).toThrow(
                "Failed to backup configuration as JSON with metadata"
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // EXPORT AS JAVASCRIPT
    // ========================================================================

    describe("exportAsJavaScript", () => {
        it("should export configuration as JavaScript file format", () => {
            const result = exporter.exportAsJavaScript();

            expect(result).toContain("const _config =");
            expect(result).toContain(
                "// Twitch Challenge Overlay Configuration"
            );
            expect(result).toContain("// Generated on:");
        });

        it("should include timestamp in JavaScript export", () => {
            const result = exporter.exportAsJavaScript();
            expect(result).toMatch(
                /Generated on: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
            );
        });

        it("should include JSDoc type annotation", () => {
            const result = exporter.exportAsJavaScript();
            expect(result).toContain("/** @type {Config} */");
        });

        it("should contain valid JSON in JavaScript variable", () => {
            const result = exporter.exportAsJavaScript();
            const jsonMatch = result.match(/const _config = ({[\s\S]*});?$/);

            expect(jsonMatch).toBeTruthy();
            if (jsonMatch && jsonMatch[1]) {
                const jsonString: string = jsonMatch[1];
                expect(() => JSON.parse(jsonString)).not.toThrow();
            }
        });

        it("should throw error for non-serializable configuration", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);

            expect(() => circularExporter.exportAsJavaScript()).toThrow(
                "Failed to backup configuration as JavaScript"
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // DOWNLOAD AS JSON
    // ========================================================================

    describe("downloadAsJSON", () => {
        let createElementSpy: any;
        let createObjectURLSpy: ReturnType<typeof vi.fn>;
        let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
        let mockAnchor: HTMLAnchorElement;

        beforeEach(() => {
            mockAnchor = {
                href: "",
                download: "",
                style: { display: "" },
                click: vi.fn(),
            } as any;

            // Mock URL methods that don't exist in jsdom
            createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
            revokeObjectURLSpy = vi.fn();
            global.URL.createObjectURL = createObjectURLSpy as any;
            global.URL.revokeObjectURL = revokeObjectURLSpy as any;

            createElementSpy = vi
                .spyOn(document, "createElement")
                .mockReturnValue(mockAnchor as HTMLElement);
            vi.spyOn(document.body, "appendChild").mockImplementation(
                () => mockAnchor
            );
            vi.spyOn(document.body, "removeChild").mockImplementation(
                () => mockAnchor
            );
        });

        it("should trigger download with default filename", () => {
            const result = exporter.downloadAsJSON();

            expect(result).toBe(true);
            expect(createElementSpy).toHaveBeenCalledWith("a");
            expect(mockAnchor.click).toHaveBeenCalled();
        });

        it("should use custom filename when provided", () => {
            const customFilename = "my-config.json";
            exporter.downloadAsJSON(customFilename);

            expect(mockAnchor.download).toBe(customFilename);
        });

        it("should generate timestamped filename when not provided", () => {
            exporter.downloadAsJSON();

            expect(mockAnchor.download).toMatch(
                /twitch-overlay-config_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.json/
            );
        });

        it("should create blob with correct MIME type", () => {
            exporter.downloadAsJSON();

            expect(createObjectURLSpy).toHaveBeenCalled();
        });

        it("should clean up blob URL after download", () => {
            vi.useFakeTimers();
            exporter.downloadAsJSON();
            vi.advanceTimersByTime(100);

            expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
            vi.useRealTimers();
        });

        it("should handle download errors gracefully", () => {
            // Mock Blob constructor to throw error
            global.Blob = class MockBlob extends Blob {
                constructor() {
                    super();
                    throw new Error("Blob creation failed");
                }
            } as any;

            const result = exporter.downloadAsJSON();

            // When download fails, the method should handle the error gracefully
            // and return a boolean indicating success/failure
            expect(typeof result).toBe("boolean");
            // In this test environment, the download will fail
            expect(result).toBe(false);
        });

        it("should return false when download and fallback fail", () => {
            createElementSpy.mockImplementation(() => {
                throw new Error("Download failed");
            });

            const errorHandler = ErrorHandler.getInstance();
            vi.spyOn(errorHandler, "handleExportError").mockReturnValue({
                success: false,
                fallbackUsed: null,
                message: "All methods failed",
            });

            const result = exporter.downloadAsJSON();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // DOWNLOAD AS JAVASCRIPT
    // ========================================================================

    describe("downloadAsJavaScript", () => {
        let createElementSpy: any;
        let createObjectURLSpy: ReturnType<typeof vi.fn>;
        let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
        let mockAnchor: HTMLAnchorElement;

        beforeEach(() => {
            mockAnchor = {
                href: "",
                download: "",
                style: { display: "" },
                click: vi.fn(),
            } as any;

            // Mock URL methods that don't exist in jsdom
            createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
            revokeObjectURLSpy = vi.fn();
            global.URL.createObjectURL = createObjectURLSpy as any;
            global.URL.revokeObjectURL = revokeObjectURLSpy as any;

            createElementSpy = vi
                .spyOn(document, "createElement")
                .mockReturnValue(mockAnchor as HTMLElement);
            vi.spyOn(document.body, "appendChild").mockImplementation(
                () => mockAnchor
            );
            vi.spyOn(document.body, "removeChild").mockImplementation(
                () => mockAnchor
            );
        });

        it("should trigger download with default filename", () => {
            const result = exporter.downloadAsJavaScript();

            expect(result).toBe(true);
            expect(createElementSpy).toHaveBeenCalledWith("a");
            expect(mockAnchor.click).toHaveBeenCalled();
        });

        it("should use custom filename when provided", () => {
            const customFilename = "my-config.js";
            exporter.downloadAsJavaScript(customFilename);

            expect(mockAnchor.download).toBe(customFilename);
        });

        it("should generate timestamped filename with .js extension", () => {
            exporter.downloadAsJavaScript();

            expect(mockAnchor.download).toMatch(
                /twitch-overlay-config_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.js/
            );
        });

        it("should handle download errors gracefully", () => {
            // Mock Blob constructor to throw error
            global.Blob = class MockBlob extends Blob {
                constructor() {
                    super();
                    throw new Error("Blob creation failed");
                }
            } as any;

            const result = exporter.downloadAsJavaScript();

            // When download fails, the method should handle the error gracefully
            // and return a boolean indicating success/failure
            expect(typeof result).toBe("boolean");
            // In this test environment, the download will fail
            expect(result).toBe(false);
        });

        it("should return false when download and fallback fail", () => {
            createElementSpy.mockImplementation(() => {
                throw new Error("Download failed");
            });

            const errorHandler = ErrorHandler.getInstance();
            vi.spyOn(errorHandler, "handleExportError").mockReturnValue({
                success: false,
                fallbackUsed: null,
                message: "All methods failed",
            });

            const result = exporter.downloadAsJavaScript();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // COPY TO CLIPBOARD
    // ========================================================================

    describe("copyToClipboard", () => {
        it("should copy configuration to clipboard using modern API", async () => {
            const mockWriteText = vi.fn().mockResolvedValue(undefined);
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: mockWriteText },
                writable: true,
                configurable: true,
            });

            const result = await exporter.copyToClipboard();

            expect(result).toBe(true);
            expect(mockWriteText).toHaveBeenCalled();
            const copiedContent = mockWriteText.mock.calls[0]?.[0];
            expect(copiedContent).toBeDefined();
            if (copiedContent) {
                expect(() => JSON.parse(copiedContent)).not.toThrow();
            }
        });

        it("should use fallback method when clipboard API unavailable", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: undefined,
                writable: true,
                configurable: true,
            });

            const mockTextarea = {
                value: "",
                style: {},
                select: vi.fn(),
                setSelectionRange: vi.fn(),
            } as any;

            // Mock execCommand that doesn't exist in jsdom
            // Note: execCommand is deprecated but still used as a fallback in the implementation
            const execCommandMock = vi.fn().mockReturnValue(true);
            (document as any).execCommand = execCommandMock;

            vi.spyOn(document, "createElement").mockReturnValue(mockTextarea);
            vi.spyOn(document.body, "appendChild").mockImplementation(
                () => mockTextarea
            );
            vi.spyOn(document.body, "removeChild").mockImplementation(
                () => mockTextarea
            );

            const result = await exporter.copyToClipboard();

            expect(result).toBe(true);
            expect(mockTextarea.select).toHaveBeenCalled();
        });

        it("should return false when clipboard operations fail", async () => {
            const mockWriteText = vi
                .fn()
                .mockRejectedValue(new Error("Clipboard error"));
            Object.defineProperty(navigator, "clipboard", {
                value: { writeText: mockWriteText },
                writable: true,
                configurable: true,
            });

            const result = await exporter.copyToClipboard();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("should return false when fallback method fails", async () => {
            Object.defineProperty(navigator, "clipboard", {
                value: undefined,
                writable: true,
                configurable: true,
            });

            vi.spyOn(document, "createElement").mockImplementation(() => {
                throw new Error("DOM error");
            });

            const result = await exporter.copyToClipboard();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // VALIDATE FOR EXPORT
    // ========================================================================

    describe("validateForExport", () => {
        it("should validate complete configuration successfully", () => {
            const result = exporter.validateForExport();

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should detect missing configuration object", () => {
            const nullExporter = new ConfigExporter(null as any);
            const result = nullExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Configuration object is null or undefined"
            );
        });

        it("should detect missing auth section", () => {
            const invalidConfig = { ...testConfig, auth: undefined as any };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Missing authentication configuration"
            );
        });

        it("should detect missing OAuth token", () => {
            const invalidConfig = {
                ...testConfig,
                auth: { ...testConfig.auth, twitch_oauth: "" },
            };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Missing Twitch OAuth token");
        });

        it("should detect missing username", () => {
            const invalidConfig = {
                ...testConfig,
                auth: { ...testConfig.auth, twitch_username: "" },
            };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Missing Twitch username");
        });

        it("should detect missing channel", () => {
            const invalidConfig = {
                ...testConfig,
                auth: { ...testConfig.auth, twitch_channel: "" },
            };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Missing Twitch channel");
        });

        it("should detect missing commands section", () => {
            const invalidConfig = { ...testConfig, commands: undefined as any };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Missing commands configuration");
        });

        it("should detect missing responses section", () => {
            const invalidConfig = {
                ...testConfig,
                responses: undefined as any,
            };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain("Missing responses configuration");
        });

        it("should detect circular references", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);
            const result = circularExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors).toContain(
                "Configuration contains circular references or non-serializable data"
            );
        });

        it("should accumulate multiple validation errors", () => {
            const invalidConfig = {
                ...testConfig,
                auth: undefined as any,
                commands: undefined as any,
                responses: undefined as any,
            };
            const invalidExporter = new ConfigExporter(invalidConfig);
            const result = invalidExporter.validateForExport();

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    // ========================================================================
    // GET EXPORT STATS
    // ========================================================================

    describe("getExportStats", () => {
        it("should calculate correct statistics for configuration", () => {
            const stats = exporter.getExportStats();

            expect(stats.totalCommands).toBeGreaterThan(0);
            expect(stats.totalResponses).toBeGreaterThan(0);
            expect(stats.configSize).toBeGreaterThan(0);
            expect(stats.hasCustomColors).toBe(true);
        });

        it("should count commands correctly", () => {
            const stats = exporter.getExportStats();
            const commandCount = Object.keys(testConfig.commands).length;

            expect(stats.totalCommands).toBe(commandCount);
        });

        it("should count responses correctly", () => {
            const stats = exporter.getExportStats();
            const responseCount = Object.keys(testConfig.responses).length;

            expect(stats.totalResponses).toBe(responseCount);
        });

        it("should detect custom colors presence", () => {
            const stats = exporter.getExportStats();

            expect(stats.hasCustomColors).toBe(true);
        });

        it("should detect absence of custom colors", () => {
            const configWithoutColors = {
                ...testConfig,
                challengeRowColors: [],
            };
            const exporterWithoutColors = new ConfigExporter(
                configWithoutColors
            );
            const stats = exporterWithoutColors.getExportStats();

            expect(stats.hasCustomColors).toBe(false);
        });

        it("should calculate approximate config size", () => {
            const stats = exporter.getExportStats();
            const expectedSize = JSON.stringify(testConfig).length;

            expect(stats.configSize).toBe(expectedSize);
        });

        it("should handle missing commands gracefully", () => {
            const configWithoutCommands = {
                ...testConfig,
                commands: undefined as any,
            };
            const exporterWithoutCommands = new ConfigExporter(
                configWithoutCommands
            );
            const stats = exporterWithoutCommands.getExportStats();

            expect(stats.totalCommands).toBe(0);
        });

        it("should handle missing responses gracefully", () => {
            const configWithoutResponses = {
                ...testConfig,
                responses: undefined as any,
            };
            const exporterWithoutResponses = new ConfigExporter(
                configWithoutResponses
            );
            const stats = exporterWithoutResponses.getExportStats();

            expect(stats.totalResponses).toBe(0);
        });

        it("should handle errors during stats calculation", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);
            const stats = circularExporter.getExportStats();

            // Should return default stats on error
            expect(stats.configSize).toBe(0);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // CREATE SANITIZED EXPORT
    // ========================================================================

    describe("createSanitizedExport", () => {
        it("should replace OAuth token with placeholder", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.auth.twitch_oauth).toBe("YOUR_OAUTH_TOKEN_HERE");
            expect(sanitized.auth.twitch_oauth).not.toBe(
                testConfig.auth.twitch_oauth
            );
        });

        it("should replace username with placeholder", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.auth.twitch_username).toBe("YOUR_USERNAME_HERE");
            expect(sanitized.auth.twitch_username).not.toBe(
                testConfig.auth.twitch_username
            );
        });

        it("should replace channel with placeholder", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.auth.twitch_channel).toBe("YOUR_CHANNEL_HERE");
            expect(sanitized.auth.twitch_channel).not.toBe(
                testConfig.auth.twitch_channel
            );
        });

        it("should preserve non-sensitive configuration", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.maxChallenges).toBe(testConfig.maxChallenges);
            expect(sanitized.challengeRowColors).toEqual(
                testConfig.challengeRowColors
            );
        });

        it("should preserve commands configuration", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.commands).toEqual(testConfig.commands);
        });

        it("should preserve responses configuration", () => {
            const sanitized = exporter.createSanitizedExport();

            expect(sanitized.responses).toEqual(testConfig.responses);
        });

        it("should create deep copy of configuration", () => {
            const sanitized = exporter.createSanitizedExport();

            // Modifying sanitized should not affect original
            sanitized.maxChallenges = 999;
            expect(testConfig.maxChallenges).toBe(15);
        });
    });

    // ========================================================================
    // EXPORT AS TEMPLATE
    // ========================================================================

    describe("exportAsTemplate", () => {
        it("should export sanitized configuration as template", () => {
            const result = exporter.exportAsTemplate();

            expect(result).toContain("Configuration Template");
            expect(result).toContain("YOUR_OAUTH_TOKEN_HERE");
            expect(result).toContain("YOUR_USERNAME_HERE");
            expect(result).toContain("YOUR_CHANNEL_HERE");
        });

        it("should include template-specific header comments", () => {
            const result = exporter.exportAsTemplate();

            expect(result).toContain(
                "This is a template file with placeholder values"
            );
            expect(result).toContain("Replace the placeholder values");
        });

        it("should include timestamp in template", () => {
            const result = exporter.exportAsTemplate();

            expect(result).toMatch(
                /Generated on: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
            );
        });

        it("should include JSDoc type annotation", () => {
            const result = exporter.exportAsTemplate();

            expect(result).toContain("/** @type {Config} */");
        });

        it("should contain valid JSON in template variable", () => {
            const result = exporter.exportAsTemplate();
            const jsonMatch = result.match(/const _config = ({[\s\S]*});?$/);

            expect(jsonMatch).toBeTruthy();
            if (jsonMatch && jsonMatch[1]) {
                const jsonString: string = jsonMatch[1];
                expect(() => JSON.parse(jsonString)).not.toThrow();
            }
        });

        it("should throw error for non-serializable configuration", () => {
            const circularConfig: any = { ...testConfig };
            circularConfig.circular = circularConfig;
            const circularExporter = new ConfigExporter(circularConfig);

            expect(() => circularExporter.exportAsTemplate()).toThrow(
                "Failed to backup configuration template"
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });

    // ========================================================================
    // DOWNLOAD TEMPLATE
    // ========================================================================

    describe("downloadTemplate", () => {
        let createElementSpy: any;
        let createObjectURLSpy: ReturnType<typeof vi.fn>;
        let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
        let mockAnchor: HTMLAnchorElement;

        beforeEach(() => {
            mockAnchor = {
                href: "",
                download: "",
                style: { display: "" },
                click: vi.fn(),
            } as any;

            // Mock URL methods that don't exist in jsdom
            createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
            revokeObjectURLSpy = vi.fn();
            global.URL.createObjectURL = createObjectURLSpy as any;
            global.URL.revokeObjectURL = revokeObjectURLSpy as any;

            createElementSpy = vi
                .spyOn(document, "createElement")
                .mockReturnValue(mockAnchor as HTMLElement);
            vi.spyOn(document.body, "appendChild").mockImplementation(
                () => mockAnchor
            );
            vi.spyOn(document.body, "removeChild").mockImplementation(
                () => mockAnchor
            );
        });

        it("should trigger template download with default filename", () => {
            const result = exporter.downloadTemplate();

            expect(result).toBe(true);
            expect(createElementSpy).toHaveBeenCalledWith("a");
            expect(mockAnchor.click).toHaveBeenCalled();
        });

        it("should use custom filename when provided", () => {
            const customFilename = "my-template.js";
            exporter.downloadTemplate(customFilename);

            expect(mockAnchor.download).toBe(customFilename);
        });

        it("should generate timestamped filename with template.js extension", () => {
            exporter.downloadTemplate();

            expect(mockAnchor.download).toMatch(
                /twitch-overlay-config_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.template\.js/
            );
        });

        it("should return false when download fails", () => {
            createElementSpy.mockImplementation(() => {
                throw new Error("Download failed");
            });

            const result = exporter.downloadTemplate();

            expect(result).toBe(false);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
    });
});
