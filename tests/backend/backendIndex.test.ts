import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../utils/chatHandlerTestUtils";

const createServiceSpies = () => {
    const getWindowSyncService = vi.fn(() => ({ destroy: vi.fn() }));
    const getChallengeService = vi.fn(() => ({ destroy: vi.fn() }));
    const getTimerService = vi.fn(() => ({ destroy: vi.fn() }));
    const getConfigService = vi.fn(() => ({ destroy: vi.fn() }));
    return {
        getWindowSyncService,
        getChallengeService,
        getTimerService,
        getConfigService,
    };
};

describe("backend/index", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("initializes core services once", async () => {
        const spies = createServiceSpies();
        vi.doMock("@backend/services/windowSyncService", () => spies);
        vi.doMock("@backend/services/challengeService", () => spies);
        vi.doMock("@backend/services/timerService", () => spies);
        vi.doMock("@backend/services/configService", () => spies);

        const module = await import("@backend/index");
        module.initializeBackendServices();

        expect(spies.getWindowSyncService).toHaveBeenCalledTimes(1);
        expect(spies.getChallengeService).toHaveBeenCalledTimes(1);
        expect(spies.getTimerService).toHaveBeenCalledTimes(1);
        expect(spies.getConfigService).toHaveBeenCalledTimes(1);
        expect(spies.getConfigService).toHaveBeenCalledWith();
    });

    it("passes default config to config service when provided", async () => {
        const spies = createServiceSpies();
        vi.doMock("@backend/services/windowSyncService", () => spies);
        vi.doMock("@backend/services/challengeService", () => spies);
        vi.doMock("@backend/services/timerService", () => spies);
        vi.doMock("@backend/services/configService", () => spies);

        const module = await import("@backend/index");
        const defaultConfig = { metadata: { version: 1 } } as unknown as Config;
        module.initializeBackendServices(defaultConfig);

        expect(spies.getConfigService).toHaveBeenCalledWith(defaultConfig);
    });
});
