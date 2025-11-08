import type {
    ChallengeCreationInput,
    ChallengeDTO,
    ChallengeSnapshot,
    ChallengeUpdateInput,
} from "@backend/services/challengeService";
import { createChallengeStore } from "@frontend/lib/stores/challengeStore";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

type ChallengeStoreApi = ReturnType<typeof createChallengeStore>;

type ChallengeSubscriber = (evt: { snapshot: ChallengeSnapshot }) => void;
type ChallengeServiceMock = ReturnType<typeof createMockChallengeService>;

const createBaseSnapshot = (): ChallengeSnapshot => ({
    challenges: [],
    totals: { total: 0, completed: 0, failed: 0, inProgress: 0 },
    hasActiveTimers: false,
    activeTimerCount: 0,
    timestamp: Date.now(),
});

const challengeSubscribers = new Set<ChallengeSubscriber>();

function createMockChallengeService() {
    const snapshot = createBaseSnapshot();
    const stubChallenge: ChallengeDTO = {
        id: "stub",
        index: 0,
        title: "Stub Challenge",
        description: "",
        amount: 1,
        progress: 0,
        progressString: "0/1",
        progressPercentage: 0,
        status: 0 as any,
        statusLabel: "Pending",
        statusEmoji: "⏳",
        timer: null,
        timerDisplay: "",
        timerRemainingSeconds: null,
        timerIsActive: false,
        timerEndBehavior: 0 as any,
        createdAt: Date.now(),
    };

    return {
        getSnapshot: vi.fn<() => ChallengeSnapshot>(() => snapshot),
        subscribe: vi.fn<(listener: ChallengeSubscriber) => () => void>(
            (listener: ChallengeSubscriber) => {
                challengeSubscribers.add(listener);
                return () => challengeSubscribers.delete(listener);
            }
        ),
        addChallenge: vi.fn<(input: ChallengeCreationInput) => ChallengeDTO>(
            () => stubChallenge
        ),
        updateChallenge: vi.fn<
            (id: string, updates: ChallengeUpdateInput) => ChallengeDTO
        >(() => stubChallenge),
        deleteChallenges: vi.fn<(ids: string[]) => void>(),
        clearAll: vi.fn<() => void>(),
        toggleCompletion: vi.fn<(id: string) => ChallengeDTO>(
            () => stubChallenge
        ),
        incrementProgress: vi.fn<(id: string, amount?: number) => ChallengeDTO>(
            () => stubChallenge
        ),
        decrementProgress: vi.fn<(id: string, amount?: number) => ChallengeDTO>(
            () => stubChallenge
        ),
        reorderChallenges: vi.fn<(order: string[]) => void>(),
        loadFromStorage: vi.fn<() => void>(),
    };
}

describe("frontend stores - challengeStore", () => {
    let challengeStore: ChallengeStoreApi;
    let service: ChallengeServiceMock;

    beforeEach(() => {
        ensureTestIsolation();
        challengeSubscribers.clear();
        service = createMockChallengeService();
        challengeStore = createChallengeStore(service);
    });

    it("subscribes to service and updates value on incoming events", () => {
        const receivedValues: ChallengeSnapshot[] = [];
        const unsubscribe = challengeStore.subscribe(
            (value: ChallengeSnapshot) => {
                receivedValues.push(value);
            }
        );
        expect(receivedValues.length).toBeGreaterThan(0);

        // Simulate an update from the service
        const next: ChallengeSnapshot = {
            challenges: [
                {
                    id: "1",
                    index: 0,
                    title: "A",
                    description: "",
                    amount: 1,
                    progress: 0,
                    progressString: "0/1",
                    progressPercentage: 0,
                    status: 0 as any,
                    statusLabel: "Pending",
                    statusEmoji: "⏳",
                    timer: null,
                    timerDisplay: "",
                    timerRemainingSeconds: null,
                    timerIsActive: false,
                    timerEndBehavior: 0 as any,
                    createdAt: Date.now(),
                },
            ],
            totals: { total: 1, completed: 0, failed: 0, inProgress: 1 },
            hasActiveTimers: false,
            activeTimerCount: 0,
            timestamp: Date.now(),
        };
        challengeSubscribers.forEach((listener) =>
            listener({ snapshot: next })
        );

        // Verify the update was received
        const lastValue = receivedValues[receivedValues.length - 1];
        expect(lastValue).toBeDefined();
        expect(lastValue!.totals.total).toBe(1);
        unsubscribe();
    });

    it("forwards method calls to the underlying service", () => {
        challengeStore.addChallenge({ title: "X" });
        expect(service.addChallenge).toHaveBeenCalled();
        challengeStore.updateChallenge("1", { title: "Y" });
        expect(service.updateChallenge).toHaveBeenCalledWith("1", {
            title: "Y",
        });
        challengeStore.deleteChallenges(["1"]);
        expect(service.deleteChallenges).toHaveBeenCalledWith(["1"]);
        challengeStore.clearAll();
        expect(service.clearAll).toHaveBeenCalled();
        challengeStore.toggleCompletion("1");
        expect(service.toggleCompletion).toHaveBeenCalledWith("1");
        challengeStore.incrementProgress("1");
        // When no amount is provided, the service is called with a single argument
        expect(service.incrementProgress).toHaveBeenCalledWith("1");
        challengeStore.incrementProgress("1", 2);
        expect(service.incrementProgress).toHaveBeenCalledWith("1", 2);
        challengeStore.decrementProgress("1");
        // When no amount is provided, only the id argument is passed
        expect(service.decrementProgress).toHaveBeenCalledWith("1");
        challengeStore.decrementProgress("1", 2);
        expect(service.decrementProgress).toHaveBeenCalledWith("1", 2);
        challengeStore.reorderChallenges(["1"]);
        expect(service.reorderChallenges).toHaveBeenCalledWith(["1"]);
        challengeStore.loadFromStorage();
        expect(service.loadFromStorage).toHaveBeenCalled();
    });
});
