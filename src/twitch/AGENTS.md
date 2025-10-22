# src/twitch/ - Twitch Integration

Twitch IRC WebSocket client and message parsing utilities.

## TwitchChat (`TwitchChat.ts`)

**WebSocket IRC client with OAuth validation**

### Features
- **Auto-reconnect**: Handles connection drops
- **OAuth validation**: Auto-adds "oauth:" prefix if missing
- **Rate limiting**: Respects Twitch rate limits
- **Message parsing**: Extracts username, message, badges
- **Event emission**: Uses EventEmitter for message broadcasts

### Configuration
```typescript
const chat = new TwitchChat({
    channel: "channelname",      // Without #
    username: "botusername",
    oauth: "oauth:abc123..."     // From twitchtokengenerator.com
});
```

### Connection Lifecycle
1. `connect()`: Establishes WebSocket connection
2. Authentication: Sends PASS/NICK/JOIN
3. PING/PONG: Automatic keepalive
4. Message handling: Parses and emits events
5. `disconnect()`: Clean shutdown

### Event System
```typescript
chat.on('message', (data) => {
    // data.username, data.message, data.isModerator, data.isBroadcaster
});

chat.on('connected', () => { /* ... */ });
chat.on('disconnected', () => { /* ... */ });
chat.on('error', (error) => { /* ... */ });
```

## EventEmitter (`EventEmitter.ts`)

**Simple pub/sub event system**

```typescript
class MyClass extends EventEmitter {
    doSomething() {
        this.emit('action', { data: 'value' });
    }
}

instance.on('action', (data) => console.log(data));
instance.off('action', handlerFn);
```

## Message Parsers (`message-parsers.ts`)

**IRC message parsing utilities**

### Functions
- `parseIRCMessage(raw)`: Parses raw IRC PRIVMSG
- `extractUsername(tags, prefix)`: Gets username from tags or prefix
- `extractMessage(params)`: Extracts message content
- `extractBadges(tags)`: Parses user badges
- `isModerator(badges)`: Checks moderator status
- `isBroadcaster(badges, username, channel)`: Checks broadcaster status

### IRC Message Format
```
@badges=moderator/1;user-id=12345 :user!user@user.tmi.twitch.tv PRIVMSG #channel :message text
```

Parsed to:
```typescript
{
    username: "user",
    message: "message text",
    isModerator: true,
    isBroadcaster: false
}
```

## Authentication

**OAuth Token Generation**: https://twitchtokengenerator.com

**Required Scopes**: `chat:read`, `chat:edit`

**Auto-correction**: TwitchChat automatically adds "oauth:" prefix if missing

## Testing Utilities (`loadTestUsers.ts`)

**Mock user data for testing**

```typescript
const testUser = {
    username: "testuser",
    isModerator: true,
    isBroadcaster: false
};
```

Used in unit tests to simulate chat messages without connecting to Twitch.
