import { createClient, RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type {
    StorageAdapter,
    StorageOptions,
    StorageResult,
} from "./StorageAdapter";

/**
 * Supabase implementation of StorageAdapter
 * Provides real-time synchronization across multiple streamers
 */
export class SupabaseStorageAdapter implements StorageAdapter {
    private client: SupabaseClient;
    private roomCode: string;
    private roomId: string | null = null;
    private subscribers: Map<string, Set<(data: any) => void>> = new Map();
    private realtimeChannels: Map<string, RealtimeChannel> = new Map();
    private initPromise: Promise<void>;

    constructor(supabaseUrl: string, supabaseKey: string, roomCode: string) {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.roomCode = roomCode;
        this.initPromise = this.initializeRoom();
    }

    /**
     * Initialize or get the room ID for this room code
     */
    private async initializeRoom(): Promise<void> {
        try {
            // Try to find existing room
            const { data: existingRoom } = await this.client
                .from("rooms")
                .select("id")
                .eq("room_code", this.roomCode)
                .single();

            if (existingRoom) {
                this.roomId = existingRoom.id;
                return;
            }

            // Create new room if not found
            const { data: newRoom, error: createError } = await this.client
                .from("rooms")
                .insert({ room_code: this.roomCode })
                .select("id")
                .single();

            if (createError) {
                throw new Error(`Failed to create room: ${createError.message}`);
            }

            this.roomId = newRoom.id;
        } catch (error) {
            console.error("Failed to initialize room:", error);
            throw error;
        }
    }

    /**
     * Ensure room is initialized before operations
     */
    private async ensureInitialized(): Promise<void> {
        await this.initPromise;
        if (!this.roomId) {
            throw new Error("Room initialization failed");
        }
    }

    async save<T>(
        key: string,
        data: T,
        options: StorageOptions = {}
    ): Promise<StorageResult<T>> {
        try {
            await this.ensureInitialized();

            const { version = "1.0.0" } = options;

            // Determine storage type based on key
            if (key.includes("config")) {
                return await this.saveConfig(data, version);
            } else if (key.includes("challenge")) {
                return await this.saveChallenges(data);
            }

            return {
                success: false,
                error: `Unsupported key type: ${key}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Save configuration data to Supabase
     */
    private async saveConfig<T>(
        data: T,
        version: string
    ): Promise<StorageResult<T>> {
        try {
            const { error } = await this.client
                .from("room_config")
                .upsert({
                    room_id: this.roomId,
                    config_data: data,
                    version,
                })
                .eq("room_id", this.roomId);

            if (error) {
                throw error;
            }

            this.notifySubscribers("config", data);

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Save challenges data to Supabase
     */
    private async saveChallenges<T>(data: T): Promise<StorageResult<T>> {
        try {
            if (!Array.isArray(data)) {
                throw new Error("Challenges data must be an array");
            }

            // Delete all existing challenges for this room
            await this.client
                .from("challenges")
                .delete()
                .eq("room_id", this.roomId);

            // Insert new challenges
            if (data.length > 0) {
                const challengesToInsert = data.map((challenge: any, index: number) => ({
                    room_id: this.roomId,
                    challenge_id: challenge.id || crypto.randomUUID(),
                    title: challenge.title,
                    description: challenge.description || "",
                    amount: challenge.amount || 1,
                    progress: challenge.progress || 0,
                    completion_status: challenge.completionStatus || false,
                    failure_status: challenge.failureStatus || false,
                    created_at: challenge.createdAt ? new Date(challenge.createdAt).toISOString() : new Date().toISOString(),
                    timer_data: challenge.timer || null,
                    position: index,
                }));

                const { error } = await this.client
                    .from("challenges")
                    .insert(challengesToInsert);

                if (error) {
                    throw error;
                }
            }

            this.notifySubscribers("challenges", data);

            return {
                success: true,
                data,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async load<T>(
        key: string,
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): Promise<StorageResult<T>> {
        try {
            await this.ensureInitialized();

            // Determine storage type based on key
            if (key.includes("config")) {
                return await this.loadConfig(defaultValue, validator);
            } else if (key.includes("challenge")) {
                return await this.loadChallenges(defaultValue, validator);
            }

            return {
                success: false,
                error: `Unsupported key type: ${key}`,
            };
        } catch (error) {
            if (defaultValue !== undefined) {
                return {
                    success: true,
                    data: defaultValue,
                    fallbackUsed: "error-default",
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Load configuration data from Supabase
     */
    private async loadConfig<T>(
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): Promise<StorageResult<T>> {
        try {
            const { data, error } = await this.client
                .from("room_config")
                .select("config_data")
                .eq("room_id", this.roomId)
                .single();

            if (error || !data) {
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "default-value",
                    };
                }
                return {
                    success: false,
                    error: "No config found",
                };
            }

            const configData = data.config_data as T;

            // Validate if validator provided
            if (validator && !validator(configData)) {
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "validation-failed",
                    };
                }
                return {
                    success: false,
                    error: "Config validation failed",
                };
            }

            return {
                success: true,
                data: configData,
            };
        } catch (error) {
            if (defaultValue !== undefined) {
                return {
                    success: true,
                    data: defaultValue,
                    fallbackUsed: "error-default",
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Load challenges data from Supabase
     */
    private async loadChallenges<T>(
        defaultValue?: T,
        validator?: (data: any) => data is T
    ): Promise<StorageResult<T>> {
        try {
            const { data, error } = await this.client
                .from("challenges")
                .select("*")
                .eq("room_id", this.roomId)
                .order("position", { ascending: true });

            if (error) {
                throw error;
            }

            if (!data || data.length === 0) {
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "default-value",
                    };
                }
                return {
                    success: true,
                    data: [] as T,
                };
            }

            // Transform database format to application format
            const challenges = data.map((row: any) => ({
                title: row.title,
                description: row.description,
                amount: row.amount,
                progress: row.progress,
                completionStatus: row.completion_status,
                failureStatus: row.failure_status,
                createdAt: new Date(row.created_at).getTime(),
                timer: row.timer_data,
            }));

            const result = challenges as T;

            // Validate if validator provided
            if (validator && !validator(result)) {
                if (defaultValue !== undefined) {
                    return {
                        success: true,
                        data: defaultValue,
                        fallbackUsed: "validation-failed",
                    };
                }
                return {
                    success: false,
                    error: "Challenges validation failed",
                };
            }

            return {
                success: true,
                data: result,
            };
        } catch (error) {
            if (defaultValue !== undefined) {
                return {
                    success: true,
                    data: defaultValue,
                    fallbackUsed: "error-default",
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async remove(key: string): Promise<StorageResult<void>> {
        try {
            await this.ensureInitialized();

            if (key.includes("config")) {
                await this.client
                    .from("room_config")
                    .delete()
                    .eq("room_id", this.roomId);
            } else if (key.includes("challenge")) {
                await this.client
                    .from("challenges")
                    .delete()
                    .eq("room_id", this.roomId);
            }

            this.notifySubscribers(key, null);

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await this.ensureInitialized();
            return this.roomId !== null;
        } catch {
            return false;
        }
    }

    async clearAll(keysToKeep: string[] = []): Promise<StorageResult<void>> {
        try {
            await this.ensureInitialized();

            // Clear challenges unless specified to keep
            if (!keysToKeep.some((key) => key.includes("challenge"))) {
                await this.client
                    .from("challenges")
                    .delete()
                    .eq("room_id", this.roomId);
                this.notifySubscribers("challenges", null);
            }

            // Clear config unless specified to keep
            if (!keysToKeep.some((key) => key.includes("config"))) {
                await this.client
                    .from("room_config")
                    .delete()
                    .eq("room_id", this.roomId);
                this.notifySubscribers("config", null);
            }

            return {
                success: true,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    subscribe<T>(key: string, callback: (data: T | null) => void): () => void {
        // Add to local subscribers
        const storageKey = key.includes("config") ? "config" : "challenges";
        if (!this.subscribers.has(storageKey)) {
            this.subscribers.set(storageKey, new Set());
        }
        this.subscribers.get(storageKey)!.add(callback);

        // Set up Supabase realtime subscription if not already exists
        if (!this.realtimeChannels.has(storageKey)) {
            this.setupRealtimeSubscription(storageKey);
        }

        // Return unsubscribe function
        return () => {
            const keySubscribers = this.subscribers.get(storageKey);
            if (keySubscribers) {
                keySubscribers.delete(callback);
                if (keySubscribers.size === 0) {
                    this.subscribers.delete(storageKey);
                    // Clean up realtime channel
                    const channel = this.realtimeChannels.get(storageKey);
                    if (channel) {
                        this.client.removeChannel(channel);
                        this.realtimeChannels.delete(storageKey);
                    }
                }
            }
        };
    }

    /**
     * Set up Supabase realtime subscription for a table
     */
    private setupRealtimeSubscription(storageKey: string): void {
        const table = storageKey === "config" ? "room_config" : "challenges";

        const channel = this.client
            .channel(`${table}_changes`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table,
                    filter: `room_id=eq.${this.roomId}`,
                },
                async () => {
                    // Reload data and notify subscribers
                    try {
                        const result = await this.load(storageKey);
                        if (result.success && result.data) {
                            this.notifySubscribers(storageKey, result.data);
                        }
                    } catch (error) {
                        console.error("Error reloading data on change:", error);
                    }
                }
            )
            .subscribe();

        this.realtimeChannels.set(storageKey, channel);
    }

    async getStatus(): Promise<{
        available: boolean;
        type: string;
        roomCode: string;
        roomId: string | null;
    }> {
        return {
            available: await this.isAvailable(),
            type: "supabase",
            roomCode: this.roomCode,
            roomId: this.roomId,
        };
    }

    private notifySubscribers(key: string, data: any): void {
        const keySubscribers = this.subscribers.get(key);
        if (keySubscribers) {
            keySubscribers.forEach((callback) => callback(data));
        }
    }

    /**
     * Disconnect and clean up all subscriptions
     */
    async disconnect(): Promise<void> {
        this.realtimeChannels.forEach((channel) => {
            this.client.removeChannel(channel);
        });
        this.realtimeChannels.clear();
        this.subscribers.clear();
    }
}
