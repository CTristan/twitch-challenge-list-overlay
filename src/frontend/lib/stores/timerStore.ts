import {
    getTimerService,
    type TimerEntry,
    type TimerSnapshot,
} from "@backend/services/timerService";
import { readable } from "svelte/store";

const createTimerStore = () => {
    const service = getTimerService();
    const { subscribe } = readable<TimerSnapshot>(
        service.getSnapshot(),
        (set) => {
            const unsubscribe = service.subscribe((snapshot) => {
                set(snapshot);
            });
            return () => unsubscribe();
        }
    );

    return {
        subscribe,
        getSnapshot: (): TimerSnapshot => service.getSnapshot(),
        startTimer: (challengeId: string): TimerEntry | null =>
            service.startTimer(challengeId),
        pauseTimer: (challengeId: string): TimerEntry | null =>
            service.pauseTimer(challengeId),
        resumeTimer: (challengeId: string): TimerEntry | null =>
            service.resumeTimer(challengeId),
        stopTimer: (challengeId: string): TimerEntry | null =>
            service.stopTimer(challengeId),
        clearTimer: (challengeId: string): void =>
            service.clearTimer(challengeId),
    };
};

export const timerStore = createTimerStore();
