# src/commands/ - Command Pattern

Command classes implementing the unified "!ch" command system.

## Command Architecture

**Pattern**: Command interface → BaseCommand → Individual command classes → CommandRegistry

**Processing Flow**:
1. TwitchChat receives message
2. App.chatHandler checks permissions
3. CommandParser extracts command and args
4. CommandTypes.normalizeCommand() resolves aliases
5. CommandHandler routes to CommandRegistry
6. CommandRegistry.execute() runs command class
7. Command returns CommandResponse
8. Response sent to Twitch chat

## Command Classes

### Core Commands
- **AddCommand**: `!ch add <description> [d=<desc>] [a=<amount>] [t=<duration>]`
- **EditCommand**: `!ch edit <id> [d=<desc>] [a=<amount>] [t=<duration>]`
- **DeleteCommand**: `!ch delete <id> [<id2> ...]` (supports multiple IDs)
- **DoneCommand**: `!ch done <id> [<id2> ...]` (marks complete)
- **UndoneCommand**: `!ch undone <id> [<id2> ...]` (marks incomplete)

### Management Commands
- **IncrementCommand**: `!ch increment <id> [amount]`
- **DecrementCommand**: `!ch decrement <id> [amount]`
- **SetCommand**: `!ch set <id> <new_amount>`
- **ClearAllCommand**: `!ch clearall` (removes all challenges)
- **ClearDoneCommand**: `!ch cleardone` (removes completed)

### Utility Commands
- **ListCommand**: `!ch list` (shows all challenges with IDs)
- **ShowCommand**: `!ch show <id>` (detailed challenge info)
- **HelpCommand**: `!ch help` (command reference)

## Command Implementation Pattern

```typescript
export default class MyCommand extends BaseCommand {
    execute(args: string[], challengeList: ChallengeList): CommandResponse {
        // 1. Validate arguments
        if (!this.validateArgs(args)) {
            return this.createResponse(false, "Error message");
        }
        
        // 2. Perform operation
        const result = challengeList.someMethod(args);
        
        // 3. Return response
        return this.createResponse(true, "Success message");
    }
}
```

## Permission Model

**ALL commands require moderator/broadcaster permissions**. Regular viewer commands are silently ignored (no response).

## Dual Syntax Support

- **key=value syntax**: `!ch add Challenge d="Full description" a=5 t=10m`
- **Simple string syntax**: `!ch add Just the challenge text`
- **Parser**: CommandParser handles both formats, extracts structured data
