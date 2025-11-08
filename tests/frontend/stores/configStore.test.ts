import type { ConfigSnapshot } from "@backend/services/configService";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureTestIsolation } from "../../utils/chatHandlerTestUtils";

const configSubscribers = new Set<
    (evt: { snapshot: ConfigSnapshot }) => void
>();

vi.mock("@backend/services/configService", () => {
    const snapshot: ConfigSnapshot = {
        config: {
            auth: { twitch_oauth: "", twitch_username: "", twitch_channel: "" },
        } as any,
        status: {} as any,
        timestamp: Date.now(),
    };
    const service = {
        getSnapshot: vi.fn(() => snapshot),
        subscribe: vi.fn(
            (listener: (evt: { snapshot: ConfigSnapshot }) => void) => {
                configSubscribers.add(listener);
                return () => configSubscribers.delete(listener);
            }
        ),
        setValue: vi.fn(() => true),
        setAll: vi.fn(() => true),
        reset: vi.fn(() => true),
        importConfig: vi.fn(() => true),
        reloadFromStorage: vi.fn(() => snapshot),
    } as const;
    return {
        getConfigService: () => service,
    };
});

describe("frontend stores - configStore", () => {
    beforeEach(() => {
        ensureTestIsolation();
        vi.clearAllMocks();
        configSubscribers.clear();
    });

    it("subscribes and receives updates", async () => {
        const { configStore } = await import(
            "@frontend/lib/stores/configStore"
        );
        let latest: any = null;
        const unsub = configStore.subscribe((v) => (latest = v));
        expect(latest).not.toBeNull();
        const next: ConfigSnapshot = {
            config: {
                auth: {
                    twitch_oauth: "tok",
                    twitch_username: "user",
                    twitch_channel: "chan",
                },
            } as any,
            status: {} as any,
            timestamp: Date.now(),
        };
        configSubscribers.forEach((fn) => fn({ snapshot: next }));
        expect(latest.config.auth.twitch_username).toBe("user");
        unsub();
    });

    it("forwards modifying operations to service", async () => {
        const { configStore } = await import(
            "@frontend/lib/stores/configStore"
        );
        const service = (
            await import("@backend/services/configService")
        ).getConfigService() as any;
        configStore.setValue("auth.twitch_username", "bob");
        expect(service.setValue).toHaveBeenCalled();
        configStore.setAll({} as any);
        expect(service.setAll).toHaveBeenCalled();
        configStore.reset();
        expect(service.reset).toHaveBeenCalled();
        configStore.importConfig({} as any);
        expect(service.importConfig).toHaveBeenCalled();
        configStore.update((c: any) => c);
        expect(service.setAll).toHaveBeenCalledTimes(2); // from update + earlier call
        configStore.reloadFromStorage();
        expect(service.reloadFromStorage).toHaveBeenCalled();
    });

    it("throws when setValue invoked with undefined", async () => {
        const { configStore } = await import(
            "@frontend/lib/stores/configStore"
        );
        expect(() => configStore.setValue("x", undefined as any)).toThrow();
    });
});
