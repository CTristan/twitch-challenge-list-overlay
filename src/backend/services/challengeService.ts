import Challenge from "@/classes/Challenge";
import ChallengeList from "@/classes/ChallengeList";
import { ChallengeStatus } from "@/types/ChallengeStatus";
import {
    CHALLENGE_UPDATE_ORIGINS,
    CHALLENGE_UPDATE_REASONS,
    CHALLENGE_UPDATE_TYPES,
    type ChallengeUpdateOriginValue,
    type ChallengeUpdateReasonValue,
    type ChallengeUpdateTypeValue,
} from "@/types/ChallengeUpdateConstants";
import { URL_HASH } from "@/types/DOMConstants";
import { STORAGE_KEYS } from "@/types/StorageConstants";
import { TimerEndBehavior } from "@/types/TimerEndBehavior";
import { WindowMode } from "@/types/WindowMode";
import { getWindowSyncService } from "@backend/services/windowSyncService";

export interface ChallengeDTO {
    id: string;
    index: number;
    title: string;
    description: string;
    amount: number;
    progress: number;
    progressString: string;
    progressPercentage: number;
    status: ChallengeStatus;
    statusLabel: string;
    statusEmoji: string;
    timer?: ChallengeTimer | null;
    timerDisplay: string;
    timerRemainingSeconds: number | null;
    timerIsActive: boolean;
    timerEndBehavior: TimerEndBehavior;
    createdAt: number;
}

export interface ChallengeTotals {
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
}

export interface ChallengeSnapshot {
    challenges: ChallengeDTO[];
    totals: ChallengeTotals;
    hasActiveTimers: boolean;
    activeTimerCount: number;
    timestamp: number;
}

export type ChallengeUpdateType = ChallengeUpdateTypeValue;

export interface ChallengeUpdateEvent {
    type: ChallengeUpdateType;
    origin: ChallengeUpdateOriginValue;
    snapshot: ChallengeSnapshot;
    changedIds?: string[];
    reason?: ChallengeUpdateReasonValue;
}

export interface ChallengeCreationInput {
    title: string;
    description?: string;
    amount?: number;
    timer?: string | number;
    timerEndBehavior?: TimerEndBehavior;
}

export interface ChallengeUpdateInput {
    title?: string;
    description?: string;
    amount?: number;
    progress?: number;
    status?: ChallengeStatus;
    timer?: string | number | null;
    timerEndBehavior?: TimerEndBehavior;
}

type ChallengeListener = (event: ChallengeUpdateEvent) => void;

interface EmitOptions {
    type: ChallengeUpdateType;
    origin: ChallengeUpdateOriginValue;
    changedIds?: string[];
    reason?: ChallengeUpdateReasonValue;
}

class ChallengeService {
    #challengeList: ChallengeList;
    #listeners: Set<ChallengeListener> = new Set();
    #snapshot: ChallengeSnapshot;
    #unsubscribeChallenge: (() => void) | null = null;
    #mode: WindowMode;
    #ignoreNextLocalSync = false;

    constructor(storeName: string = STORAGE_KEYS.CHALLENGE_LIST) {
        this.#challengeList = new ChallengeList(storeName);
        this.#mode =
            window.location.hash === URL_HASH.ADMIN
                ? WindowMode.ADMIN
                : WindowMode.VIEWER;
        this.#snapshot = this.#buildSnapshot();
        this.#connectWindowSync();
    }

    subscribe(listener: ChallengeListener): () => void {
        this.#listeners.add(listener);
        listener({
            type: CHALLENGE_UPDATE_TYPES.INIT,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            snapshot: this.#snapshot,
        });
        return () => {
            this.#listeners.delete(listener);
        };
    }

    getSnapshot(): ChallengeSnapshot {
        return this.#snapshot;
    }

    addChallenge(input: ChallengeCreationInput): ChallengeDTO {
        const challengeOptions: ConstructorParameters<typeof Challenge>[1] = {};

        if (input.description !== undefined) {
            challengeOptions.description = input.description;
        }
        if (input.amount !== undefined) {
            challengeOptions.amount = input.amount;
        }
        if (input.timer !== undefined) {
            challengeOptions.timer = input.timer;
        }
        if (input.timerEndBehavior !== undefined) {
            challengeOptions.timerEndBehavior = input.timerEndBehavior;
        }

        const challenge = new Challenge(input.title, challengeOptions);

        this.#challengeList.addChallengeObjects(challenge);
        const mapped = this.#mapChallenge(
            challenge,
            this.#challengeList.getAllChallenges().length - 1
        );
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.ADD,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [challenge.id],
        });
        this.#broadcastLocalChange();
        return mapped;
    }

    updateChallenge(id: string, updates: ChallengeUpdateInput): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);

        if (updates.title !== undefined) {
            challenge.setTitle(updates.title);
        }
        if (updates.description !== undefined) {
            challenge.setDescription(updates.description);
        }
        if (updates.amount !== undefined) {
            challenge.setAmount(updates.amount);
        }
        if (updates.progress !== undefined) {
            challenge.setProgress(updates.progress);
        }
        if (updates.status !== undefined) {
            challenge.setStatus(updates.status);
        }
        if (updates.timerEndBehavior !== undefined) {
            challenge.setTimerEndBehavior(updates.timerEndBehavior);
        }
        if (updates.timer !== undefined) {
            if (updates.timer === null) {
                challenge.clearTimer();
            } else {
                challenge.setTimer(updates.timer);
            }
        }

        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#challengeList.getAllChallenges().findIndex((c) => c.id === id)
        );
    }

    deleteChallenges(ids: string[]): void {
        this.#challengeList.deleteChallenges(
            ids
                .map((id) => this.#findChallengeIndexById(id))
                .filter((index): index is number => index !== null)
        );
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.DELETE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: ids,
        });
        this.#broadcastLocalChange();
    }

    clearAll(): void {
        const removedIds = this.#challengeList
            .getAllChallenges()
            .map((challenge) => challenge.id);
        this.#challengeList.clearChallengeList();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.DELETE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: removedIds,
            reason: CHALLENGE_UPDATE_REASONS.CLEAR_ALL,
        });
        this.#broadcastLocalChange();
    }

    toggleCompletion(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        const updated = this.#challengeList.toggleChallengeCompletion(id);
        if (!updated) {
            throw new Error(`Challenge with id ${id} not found`);
        }
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    incrementProgress(id: string, amount: number = 1): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        challenge.incrementProgress(amount);
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    decrementProgress(id: string, amount: number = 1): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        challenge.decrementProgress(amount);
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    reorderChallenges(newOrder: string[]): void {
        const current = this.#challengeList.getAllChallenges();
        const idToChallenge = new Map<string, Challenge>();
        current.forEach((challenge) => {
            idToChallenge.set(challenge.id, challenge);
        });

        const reordered: Challenge[] = [];
        newOrder.forEach((id) => {
            const challenge = idToChallenge.get(id);
            if (challenge) {
                reordered.push(challenge);
                idToChallenge.delete(id);
            }
        });
        // Append any remaining challenges that weren't specified in new order
        reordered.push(...Array.from(idToChallenge.values()));

        this.#challengeList.challenges = reordered;
        this.#challengeList.saveToLocalStorage();

        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.REORDER,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: reordered.map((challenge) => challenge.id),
        });
        this.#broadcastLocalChange();
    }

    loadFromStorage(): void {
        this.#challengeList.loadFromLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.SYNC,
            origin: CHALLENGE_UPDATE_ORIGINS.EXTERNAL,
        });
    }

    startTimer(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        if (!challenge.timer) {
            throw new Error(`Challenge with id ${id} does not have a timer`);
        }

        challenge.startTimer();
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
            reason: CHALLENGE_UPDATE_REASONS.TIMER_START,
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    pauseTimer(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        if (!challenge.timer) {
            throw new Error(`Challenge with id ${id} does not have a timer`);
        }

        challenge.timer.pause();
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
            reason: CHALLENGE_UPDATE_REASONS.TIMER_PAUSE,
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    resumeTimer(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        if (!challenge.timer) {
            throw new Error(`Challenge with id ${id} does not have a timer`);
        }

        challenge.timer.resume();
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
            reason: CHALLENGE_UPDATE_REASONS.TIMER_RESUME,
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    stopTimer(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        if (!challenge.timer) {
            throw new Error(`Challenge with id ${id} does not have a timer`);
        }

        challenge.stopTimer();
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
            reason: CHALLENGE_UPDATE_REASONS.TIMER_STOP,
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    clearTimer(id: string): ChallengeDTO {
        const challenge = this.#getChallengeOrThrow(id);
        if (!challenge.timer) {
            throw new Error(`Challenge with id ${id} does not have a timer`);
        }

        challenge.clearTimer();
        this.#challengeList.saveToLocalStorage();
        this.#emit({
            type: CHALLENGE_UPDATE_TYPES.UPDATE,
            origin: CHALLENGE_UPDATE_ORIGINS.LOCAL,
            changedIds: [id],
            reason: CHALLENGE_UPDATE_REASONS.TIMER_CLEAR,
        });
        this.#broadcastLocalChange();
        return this.#mapChallenge(
            challenge,
            this.#findChallengeIndexById(id) ?? 0
        );
    }

    getLegacyChallengeList(): ChallengeList {
        return this.#challengeList;
    }

    destroy(): void {
        this.#listeners.clear();
        if (this.#unsubscribeChallenge) {
            this.#unsubscribeChallenge();
            this.#unsubscribeChallenge = null;
        }
    }

    resetForTesting(): void {
        this.destroy();
        this.#challengeList.clearChallengeList();
        this.#snapshot = this.#buildSnapshot();
        this.#connectWindowSync();
    }

    #connectWindowSync(): void {
        const service = getWindowSyncService();
        if (this.#unsubscribeChallenge) {
            this.#unsubscribeChallenge();
            this.#unsubscribeChallenge = null;
        }
        this.#unsubscribeChallenge = service.subscribeToChallenge((event) => {
            const origin =
                event.source === this.#mode
                    ? CHALLENGE_UPDATE_ORIGINS.LOCAL
                    : CHALLENGE_UPDATE_ORIGINS.EXTERNAL;

            if (origin === "local" && this.#ignoreNextLocalSync) {
                this.#ignoreNextLocalSync = false;
                return;
            }

            this.#challengeList.loadFromLocalStorage();
            this.#emit({
                type: CHALLENGE_UPDATE_TYPES.SYNC,
                origin,
                reason: CHALLENGE_UPDATE_REASONS.BROADCAST,
            });
        });
    }

    #broadcastLocalChange(): void {
        try {
            this.#ignoreNextLocalSync = true;
            getWindowSyncService().notifyChallengeStateChanged();
        } catch (error) {
            this.#ignoreNextLocalSync = false;
            console.error(
                "Failed to broadcast challenge state change via WindowSyncService:",
                error
            );
        }
    }

    #emit({ type, origin, changedIds, reason }: EmitOptions): void {
        this.#snapshot = this.#buildSnapshot();
        const event: ChallengeUpdateEvent = {
            type,
            origin,
            snapshot: this.#snapshot,
        };

        if (changedIds !== undefined) {
            event.changedIds = changedIds;
        }

        if (reason !== undefined) {
            event.reason = reason;
        }
        this.#listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error("ChallengeService listener error", error);
            }
        });
    }

    #buildSnapshot(): ChallengeSnapshot {
        const challenges = this.#challengeList
            .getAllChallenges()
            .map((challenge, index) => this.#mapChallenge(challenge, index));

        let completed = 0;
        let failed = 0;

        challenges.forEach((challenge) => {
            if (challenge.status === ChallengeStatus.COMPLETED) {
                completed += 1;
            } else if (challenge.status === ChallengeStatus.FAILED) {
                failed += 1;
            }
        });

        const totals: ChallengeTotals = {
            total: this.#challengeList.totalChallenges,
            completed,
            failed,
            inProgress:
                this.#challengeList.totalChallenges - completed - failed,
        };

        const activeTimerCount = challenges.filter(
            (challenge) => challenge.timerIsActive
        ).length;

        return {
            challenges,
            totals,
            hasActiveTimers: activeTimerCount > 0,
            activeTimerCount,
            timestamp: Date.now(),
        };
    }

    #mapChallenge(challenge: Challenge, index: number): ChallengeDTO {
        const timer = challenge.timer?.toData() ?? null;
        const timerIsActive = challenge.timer?.isActive ?? false;
        const timerRemainingSeconds = timerIsActive
            ? challenge.timer?.getRemainingTime() ?? 0
            : null;

        const amount = challenge.amount || 1;
        const progressPercentage = Math.min(challenge.progress / amount, 1);

        return {
            id: challenge.id,
            index,
            title: challenge.title,
            description: challenge.description,
            amount: challenge.amount,
            progress: challenge.progress,
            progressString: challenge.getProgressString(),
            progressPercentage: Number.isFinite(progressPercentage)
                ? progressPercentage
                : 0,
            status: challenge.status,
            statusLabel: challenge.getState(),
            statusEmoji: challenge.getStatusEmoji(),
            timer,
            timerDisplay: challenge.getTimerString(),
            timerRemainingSeconds,
            timerIsActive,
            timerEndBehavior: challenge.getTimerEndBehavior(),
            createdAt: challenge.createdAt,
        };
    }

    #getChallengeOrThrow(id: string): Challenge {
        const challenge = this.#challengeList.getChallengeById(id);
        if (!challenge) {
            throw new Error(`Challenge with id ${id} not found`);
        }
        return challenge;
    }

    #findChallengeIndexById(id: string): number | null {
        const challenges = this.#challengeList.getAllChallenges();
        for (let index = 0; index < challenges.length; index += 1) {
            if (challenges[index]?.id === id) {
                return index;
            }
        }
        return null;
    }
}

let challengeServiceInstance: ChallengeService | null = null;

export const getChallengeService = (): ChallengeService => {
    if (!challengeServiceInstance) {
        challengeServiceInstance = new ChallengeService();
    }
    return challengeServiceInstance;
};

export const resetChallengeServiceForTesting = (): void => {
    if (challengeServiceInstance) {
        challengeServiceInstance.resetForTesting();
        challengeServiceInstance = null;
    }
};
