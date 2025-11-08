import type {
    ChallengeSnapshot,
    ChallengeUpdateEvent,
} from "@backend/services/challengeService";
import { getChallengeService } from "@backend/services/challengeService";
import type {
    ConfigSnapshot,
    ConfigUpdateEvent,
} from "@backend/services/configService";
import { getConfigService } from "@backend/services/configService";
import {
    getTimerService,
    type TimerEntry,
    type TimerSnapshot,
} from "@backend/services/timerService";
import {
    getTwitchChatService,
    type TwitchConnectionState,
} from "@backend/services/twitchChatService";
import {
    getWindowSyncService,
    type WindowConnectionState,
} from "@backend/services/windowSyncService";

export const legacyChallengeBridge = {
    subscribe: (
        listener: (event: ChallengeUpdateEvent) => void
    ): (() => void) => getChallengeService().subscribe(listener),
    snapshot: (): ChallengeSnapshot => getChallengeService().getSnapshot(),
};

export const legacyConfigBridge = {
    subscribe: (listener: (event: ConfigUpdateEvent) => void): (() => void) =>
        getConfigService().subscribe(listener),
    snapshot: (): ConfigSnapshot => getConfigService().getSnapshot(),
};

export const legacyWindowConnectionBridge = {
    subscribe: (
        listener: (state: WindowConnectionState) => void
    ): (() => void) => getWindowSyncService().subscribeToConnection(listener),
    state: (): WindowConnectionState =>
        getWindowSyncService().getConnectionState(),
};

export const legacyTwitchBridge = {
    connectionState: (): TwitchConnectionState =>
        getTwitchChatService().getConnectionState(),
    subscribeToConnection: (
        listener: (state: TwitchConnectionState) => void
    ): (() => void) => getTwitchChatService().subscribeToConnection(listener),
    subscribeToCommands: (
        listener: (data: CommandData) => void
    ): (() => void) => getTwitchChatService().subscribeToCommands(listener),
    connect: (auth: Config["auth"]): void =>
        getTwitchChatService().connect(auth),
    disconnect: (): void => getTwitchChatService().disconnect(),
    sendMessage: (message: string, messageId?: string): void =>
        getTwitchChatService().sendMessage(message, messageId),
};

export const legacyTimerBridge = {
    subscribe: (listener: (snapshot: TimerSnapshot) => void): (() => void) =>
        getTimerService().subscribe(listener),
    snapshot: (): TimerSnapshot => getTimerService().getSnapshot(),
    startTimer: (challengeId: string): TimerEntry | null =>
        getTimerService().startTimer(challengeId),
    pauseTimer: (challengeId: string): TimerEntry | null =>
        getTimerService().pauseTimer(challengeId),
    resumeTimer: (challengeId: string): TimerEntry | null =>
        getTimerService().resumeTimer(challengeId),
    stopTimer: (challengeId: string): TimerEntry | null =>
        getTimerService().stopTimer(challengeId),
    clearTimer: (challengeId: string): void =>
        getTimerService().clearTimer(challengeId),
};
