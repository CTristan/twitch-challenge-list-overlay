import Challenge from "@/classes/Challenge";
import { ChallengeStatus } from "@/types/ChallengeStatus";
import { TimerEndBehavior } from "@/types/TimerEndBehavior";
import {
    getChallengeService,
    type ChallengeUpdateEvent,
} from "@backend/services/challengeService";

type TimerListener = (snapshot: TimerSnapshot) => void;

type Unsubscribe = () => void;

export interface TimerEntry {
    challengeId: string;
    title: string;
    status: ChallengeStatus;
    isActive: boolean;
    isPaused: boolean;
    isExpired: boolean;
    durationSeconds: number;
    remainingSeconds: number;
    elapsedSeconds: number;
    progressPercentage: number;
    displayTime: string;
    statusEmoji: string;
    endBehavior: TimerEndBehavior;
    startedAt: number | null;
    endsAt: number | null;
}

export interface TimerSnapshot {
    timers: TimerEntry[];
    hasActiveTimers: boolean;
    activeTimerCount: number;
    nextExpirationTimestamp: number | null;
    timestamp: number;
}

class TimerService {
    #challengeService = getChallengeService();
    #listeners: Set<TimerListener> = new Set();
    #intervalId: number | null = null;
    #snapshot: TimerSnapshot;
    #unsubscribeChallenge: Unsubscribe | null = null;

    constructor() {
        this.#snapshot = this.#buildSnapshot();
        this.#subscribeToChallengeService();
        this.#updateInterval();
    }

    subscribe(listener: TimerListener): Unsubscribe {
        this.#listeners.add(listener);
        listener(this.#snapshot);
        return () => {
            this.#listeners.delete(listener);
        };
    }

    getSnapshot(): TimerSnapshot {
        return this.#snapshot;
    }

    startTimer(challengeId: string): TimerEntry | null {
        this.#challengeService.startTimer(challengeId);
        return this.#findTimerEntry(challengeId);
    }

    pauseTimer(challengeId: string): TimerEntry | null {
        this.#challengeService.pauseTimer(challengeId);
        return this.#findTimerEntry(challengeId);
    }

    resumeTimer(challengeId: string): TimerEntry | null {
        this.#challengeService.resumeTimer(challengeId);
        return this.#findTimerEntry(challengeId);
    }

    stopTimer(challengeId: string): TimerEntry | null {
        this.#challengeService.stopTimer(challengeId);
        return this.#findTimerEntry(challengeId);
    }

    clearTimer(challengeId: string): void {
        this.#challengeService.clearTimer(challengeId);
    }

    destroy(): void {
        this.#listeners.clear();
        this.#stopInterval();
        if (this.#unsubscribeChallenge) {
            this.#unsubscribeChallenge();
            this.#unsubscribeChallenge = null;
        }
    }

    #subscribeToChallengeService(): void {
        if (this.#unsubscribeChallenge) {
            this.#unsubscribeChallenge();
            this.#unsubscribeChallenge = null;
        }
        this.#unsubscribeChallenge = this.#challengeService.subscribe(
            (event: ChallengeUpdateEvent) => {
                if (event.snapshot.hasActiveTimers) {
                    this.#ensureInterval();
                }
                this.#snapshot = this.#buildSnapshot();
                this.#emit();
                this.#updateInterval();
            }
        );
    }

    #findTimerEntry(challengeId: string): TimerEntry | null {
        return (
            this.#snapshot.timers.find(
                (entry) => entry.challengeId === challengeId
            ) ?? null
        );
    }

    #emit(): void {
        this.#listeners.forEach((listener) => {
            try {
                listener(this.#snapshot);
            } catch (error) {
                console.error("TimerService listener error", error);
            }
        });
    }

    #ensureInterval(): void {
        if (this.#intervalId !== null) {
            return;
        }
        this.#intervalId = window.setInterval(() => {
            this.#tick();
        }, 1000);
    }

    #stopInterval(): void {
        if (this.#intervalId !== null) {
            window.clearInterval(this.#intervalId);
            this.#intervalId = null;
        }
    }

    #updateInterval(): void {
        if (this.#snapshot.hasActiveTimers) {
            this.#ensureInterval();
        } else {
            this.#stopInterval();
        }
    }

    #tick(): void {
        this.#handleExpiredTimers();
        this.#snapshot = this.#buildSnapshot();
        this.#emit();
        this.#updateInterval();
    }

    #handleExpiredTimers(): void {
        const challengeList = this.#challengeService.getLegacyChallengeList();
        const challenges = challengeList.getAllChallenges();

        challenges.forEach((challenge) => {
            const timer = challenge.timer;
            if (!timer || !timer.isActive) {
                return;
            }

            if (timer.getRemainingTime() > 0) {
                return;
            }

            this.#applyTimerExpiration(challenge);
        });
    }

    #applyTimerExpiration(challenge: Challenge): void {
        const behavior = challenge.getTimerEndBehavior();
        if (behavior === TimerEndBehavior.AUTO_COMPLETE) {
            this.#challengeService.updateChallenge(challenge.id, {
                status: ChallengeStatus.COMPLETED,
            });
        } else {
            this.#challengeService.updateChallenge(challenge.id, {
                status: ChallengeStatus.FAILED,
            });
        }
    }

    #buildSnapshot(): TimerSnapshot {
        const challengeList = this.#challengeService.getLegacyChallengeList();
        const challenges = challengeList.getAllChallenges();
        const timers: TimerEntry[] = [];
        let nextExpiration: number | null = null;

        challenges.forEach((challenge) => {
            const timer = challenge.timer;
            if (!timer) {
                return;
            }

            const remainingSeconds = this.#getRemainingSeconds(timer);
            const durationSeconds = timer.duration;
            const elapsedSeconds = Math.min(
                durationSeconds,
                Math.max(0, durationSeconds - remainingSeconds)
            );
            const progressPercentage =
                durationSeconds > 0
                    ? Math.min(1, elapsedSeconds / durationSeconds)
                    : 0;

            const entry: TimerEntry = {
                challengeId: challenge.id,
                title: challenge.title,
                status: challenge.status,
                isActive: timer.isActive,
                isPaused: timer.isPaused,
                isExpired: timer.isExpired(),
                durationSeconds,
                remainingSeconds,
                elapsedSeconds,
                progressPercentage,
                displayTime: timer.getFormattedTime(remainingSeconds),
                statusEmoji: timer.getStatusDisplay(),
                endBehavior: challenge.getTimerEndBehavior(),
                startedAt: timer.startTime > 0 ? timer.startTime : null,
                endsAt: timer.endTime > 0 ? timer.endTime : null,
            };
            timers.push(entry);

            if (entry.isActive && !entry.isPaused && entry.endsAt !== null) {
                if (nextExpiration === null || entry.endsAt < nextExpiration) {
                    nextExpiration = entry.endsAt;
                }
            }
        });

        timers.sort((left, right) => {
            if (left.isActive !== right.isActive) {
                return left.isActive ? -1 : 1;
            }
            if (left.isPaused !== right.isPaused) {
                return left.isPaused ? 1 : -1;
            }
            return left.remainingSeconds - right.remainingSeconds;
        });

        const activeTimerCount = timers.filter(
            (timer) => timer.isActive
        ).length;

        return {
            timers,
            hasActiveTimers: activeTimerCount > 0,
            activeTimerCount,
            nextExpirationTimestamp: nextExpiration,
            timestamp: Date.now(),
        };
    }

    #getRemainingSeconds(timer: Challenge["timer"]): number {
        if (!timer) {
            return 0;
        }

        if (timer.isActive) {
            return Math.max(0, timer.getRemainingTime());
        }

        if (timer.isExpired()) {
            return 0;
        }

        if (timer.startTime > 0 && timer.endTime > 0) {
            return Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
        }

        return timer.duration;
    }
}

let timerServiceInstance: TimerService | null = null;

export const getTimerService = (): TimerService => {
    if (!timerServiceInstance) {
        timerServiceInstance = new TimerService();
    }
    return timerServiceInstance;
};

export const resetTimerServiceForTesting = (): void => {
    if (timerServiceInstance) {
        timerServiceInstance.destroy();
        timerServiceInstance = null;
    }
};
