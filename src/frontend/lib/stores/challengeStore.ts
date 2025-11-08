import {
    getChallengeService,
    type ChallengeCreationInput,
    type ChallengeSnapshot,
    type ChallengeUpdateInput,
} from "@backend/services/challengeService";
import { readable } from "svelte/store";

type ChallengeServiceApi = ReturnType<typeof getChallengeService>;
type ChallengeServiceAdapter = Pick<
    ChallengeServiceApi,
    | "getSnapshot"
    | "subscribe"
    | "addChallenge"
    | "updateChallenge"
    | "deleteChallenges"
    | "clearAll"
    | "toggleCompletion"
    | "incrementProgress"
    | "decrementProgress"
    | "reorderChallenges"
    | "loadFromStorage"
>;

export const createChallengeStore = (
    service: ChallengeServiceAdapter = getChallengeService()
) => {
    const { subscribe } = readable<ChallengeSnapshot>(
        service.getSnapshot(),
        (set) => {
            const unsubscribe = service.subscribe((event) => {
                set(event.snapshot);
            });
            return () => unsubscribe();
        }
    );

    return {
        subscribe,
        getSnapshot: (): ChallengeSnapshot => service.getSnapshot(),
        addChallenge: (input: ChallengeCreationInput) =>
            service.addChallenge(input),
        updateChallenge: (id: string, updates: ChallengeUpdateInput) =>
            service.updateChallenge(id, updates),
        deleteChallenges: (ids: string[]) => service.deleteChallenges(ids),
        clearAll: () => service.clearAll(),
        toggleCompletion: (id: string) => service.toggleCompletion(id),
        incrementProgress: (id: string, amount?: number) =>
            amount !== undefined
                ? service.incrementProgress(id, amount)
                : service.incrementProgress(id),
        decrementProgress: (id: string, amount?: number) =>
            amount !== undefined
                ? service.decrementProgress(id, amount)
                : service.decrementProgress(id),
        reorderChallenges: (order: string[]) =>
            service.reorderChallenges(order),
        loadFromStorage: () => service.loadFromStorage(),
    };
};

export const challengeStore = createChallengeStore();
