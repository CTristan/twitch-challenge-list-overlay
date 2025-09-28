import { describe, expect, it } from "vitest";
import CommandParser from "../../src/utils/CommandParser";

describe("CommandParser", () => {
    describe("parseCommand", () => {
        it("should parse simple add command with title", () => {
            const result = CommandParser.parseCommand('add "Kick zombies"');

            expect(result.command).toBe("add");
            expect(result.parameters.title).toBe('"Kick zombies"');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should parse add command with multiple parameters", () => {
            const result = CommandParser.parseCommand(
                'add "Kick zombies" d="Off the roof" a=30 t=10m'
            );

            expect(result.command).toBe("add");
            expect(result.parameters.title).toBe('"Kick zombies"');
            expect(result.parameters.desc).toBe('"Off the roof"');
            expect(result.parameters.amount).toBe("30");
            expect(result.parameters.timer).toBe("10m");
            expect(result.isValid).toBe(true);
        });

        it("should parse command with abbreviated parameter aliases", () => {
            const result = CommandParser.parseCommand(
                'add "Test" d="Description" a=5 t=1h'
            );

            expect(result.command).toBe("add");
            expect(result.parameters.title).toBe('"Test"');
            expect(result.parameters.desc).toBe('"Description"');
            expect(result.parameters.amount).toBe("5");
            expect(result.parameters.timer).toBe("1h");
            expect(result.isValid).toBe(true);
        });

        it("should parse command with full parameter names", () => {
            const result = CommandParser.parseCommand(
                'add "Test" desc="Description" amount=5 timer=1h'
            );

            expect(result.command).toBe("add");
            expect(result.parameters.title).toBe('"Test"');
            expect(result.parameters.desc).toBe('"Description"');
            expect(result.parameters.amount).toBe("5");
            expect(result.parameters.timer).toBe("1h");
            expect(result.isValid).toBe(true);
        });

        it("should parse command with mixed abbreviated and full parameter names", () => {
            const result = CommandParser.parseCommand(
                'add "Test" d="Description" amount=5 t=1h'
            );

            expect(result.command).toBe("add");
            expect(result.parameters.title).toBe('"Test"');
            expect(result.parameters.desc).toBe('"Description"');
            expect(result.parameters.amount).toBe("5");
            expect(result.parameters.timer).toBe("1h");
            expect(result.isValid).toBe(true);
        });

        it("should parse increment command with target ID", () => {
            const result = CommandParser.parseCommand("+ A7 5");

            expect(result.command).toBe("+");
            expect(result.targetId).toBe("A7");
            expect(result.isValid).toBe(true);
        });

        it("should parse edit command with target ID and parameters", () => {
            const result = CommandParser.parseCommand("edit A7 a=50");

            expect(result.command).toBe("edit");
            expect(result.targetId).toBe("A7");
            expect(result.parameters.amount).toBe("50");
            expect(result.isValid).toBe(true);
        });

        it("should handle quoted strings with spaces", () => {
            const result = CommandParser.parseCommand(
                'add "Kick 30 zombies off the roof" d="Use only melee weapons"'
            );

            expect(result.parameters.title).toBe(
                '"Kick 30 zombies off the roof"'
            );
            expect(result.parameters.desc).toBe('"Use only melee weapons"');
            expect(result.isValid).toBe(true);
        });

        it("should handle single quotes", () => {
            const result = CommandParser.parseCommand(
                "add 'Single quoted title' d='Single quoted desc'"
            );

            expect(result.parameters.title).toBe("'Single quoted title'");
            expect(result.parameters.desc).toBe("'Single quoted desc'");
            expect(result.isValid).toBe(true);
        });

        it("should validate required parameters for add command", () => {
            const result = CommandParser.parseCommand(
                'add "Test Title" d="Description provided"'
            );

            expect(result.isValid).toBe(true);
            expect(result.parameters.title).toBe('"Test Title"');
            expect(result.parameters.desc).toBe('"Description provided"');
        });

        it("should validate unknown parameters", () => {
            const result = CommandParser.parseCommand(
                'add "Test" unknown=value'
            );

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((e) =>
                    e.includes("Unknown parameter 'unknown'")
                )
            ).toBe(true);
        });

        it("should validate amount parameter with abbreviated form", () => {
            const result = CommandParser.parseCommand('add "Test" a=invalid');

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Challenge amount must be a number"
            );
        });

        it("should validate amount parameter with full form", () => {
            const result = CommandParser.parseCommand(
                'add "Test" amount=invalid'
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Challenge amount must be a number"
            );
        });

        it("should validate timer format with abbreviated form", () => {
            const result = CommandParser.parseCommand('add "Test" t=invalid');

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((e) => e.includes("Timer format invalid"))
            ).toBe(true);
        });

        it("should validate timer format with full form", () => {
            const result = CommandParser.parseCommand(
                'add "Test" timer=invalid'
            );

            expect(result.isValid).toBe(false);
            expect(
                result.errors.some((e) => e.includes("Timer format invalid"))
            ).toBe(true);
        });

        it("should handle empty command", () => {
            const result = CommandParser.parseCommand("");

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Command cannot be empty");
        });
    });

    describe("unquoteString", () => {
        it("should remove double quotes", () => {
            expect(CommandParser.unquoteString('"Hello World"')).toBe(
                "Hello World"
            );
        });

        it("should remove single quotes", () => {
            expect(CommandParser.unquoteString("'Hello World'")).toBe(
                "Hello World"
            );
        });

        it("should handle unquoted strings", () => {
            expect(CommandParser.unquoteString("Hello")).toBe("Hello");
        });

        it("should handle empty strings", () => {
            expect(CommandParser.unquoteString("")).toBe("");
        });

        it("should handle mismatched quotes", () => {
            expect(CommandParser.unquoteString("\"Hello World'")).toBe(
                "\"Hello World'"
            );
        });
    });

    describe("parsePositionalCommand", () => {
        it("should parse single index", () => {
            const result = CommandParser.parsePositionalCommand("1");
            expect(result.index).toBe(0); // Convert to 0-based
        });

        it("should parse index with value", () => {
            const result =
                CommandParser.parsePositionalCommand("1 new description");
            expect(result.index).toBe(0);
            expect(result.value).toBe("new description");
        });

        it("should parse comma-separated values", () => {
            const result = CommandParser.parsePositionalCommand("1, 2, 3");
            expect(result.values).toEqual(["1", "2", "3"]);
        });

        it("should handle single value", () => {
            const result =
                CommandParser.parsePositionalCommand("description only");
            expect(result.value).toBe("description only");
        });

        it("should handle empty input", () => {
            const result = CommandParser.parsePositionalCommand("");
            expect(result).toEqual({});
        });
    });
});
