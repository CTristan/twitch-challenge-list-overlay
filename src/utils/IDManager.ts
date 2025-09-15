/**
 * @class IDManager
 * Manages short base36 IDs for challenges, providing human-readable identifiers
 * that are easy to reference in chat commands (e.g., A7, 1Z, B3).
 */
export default class IDManager {
  private static instance: IDManager | null = null;
  private static readonly STORAGE_KEY = "challenge_id_counter";
  private static readonly ID_MAP_KEY = "challenge_id_mapping";
  
  private counter: number = 1;
  private idMap: Map<string, string> = new Map(); // old ID -> new short ID
  private reverseMap: Map<string, string> = new Map(); // short ID -> old ID

  /**
   * Get singleton instance
   */
  static getInstance(): IDManager {
    if (!IDManager.instance) {
      IDManager.instance = new IDManager();
    }
    return IDManager.instance;
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.loadFromStorage();
  }

  /**
   * Generate a new short base36 ID
   * @returns Short base36 ID (e.g., "1", "A", "1Z")
   */
  generateNewId(): string {
    const shortId = this.counter.toString(36).toUpperCase();
    this.counter++;
    this.saveCounter();
    return shortId;
  }

  /**
   * Get or create a short ID for an existing long ID
   * @param longId - The existing long timestamp-based ID
   * @returns Short base36 ID
   */
  getShortId(longId: string): string {
    // Check if we already have a mapping
    if (this.idMap.has(longId)) {
      return this.idMap.get(longId)!;
    }

    // Generate new short ID and create mapping
    const shortId = this.generateNewId();
    this.idMap.set(longId, shortId);
    this.reverseMap.set(shortId, longId);
    this.saveMapping();
    return shortId;
  }

  /**
   * Get the original long ID from a short ID
   * @param shortId - The short base36 ID
   * @returns Original long ID or null if not found
   */
  getLongId(shortId: string): string | null {
    return this.reverseMap.get(shortId.toUpperCase()) || null;
  }

  /**
   * Check if a short ID exists
   * @param shortId - The short ID to check
   * @returns Whether the ID exists
   */
  hasShortId(shortId: string): boolean {
    return this.reverseMap.has(shortId.toUpperCase());
  }

  /**
   * Validate short ID format
   * @param id - ID to validate
   * @returns Whether the ID format is valid
   */
  isValidShortIdFormat(id: string): boolean {
    // Base36 format: alphanumeric, case-insensitive
    return /^[0-9A-Z]+$/i.test(id) && id.length <= 3;
  }

  /**
   * Remove mapping for a deleted challenge
   * @param longId - The long ID to remove
   */
  removeMapping(longId: string): void {
    const shortId = this.idMap.get(longId);
    if (shortId) {
      this.idMap.delete(longId);
      this.reverseMap.delete(shortId);
      this.saveMapping();
    }
  }

  /**
   * Get all current mappings (for debugging/admin purposes)
   * @returns Object with mapping information
   */
  getAllMappings(): { longToShort: Record<string, string>; shortToLong: Record<string, string> } {
    return {
      longToShort: Object.fromEntries(this.idMap),
      shortToLong: Object.fromEntries(this.reverseMap)
    };
  }

  /**
   * Reset all mappings and counter (use with caution)
   */
  reset(): void {
    this.counter = 1;
    this.idMap.clear();
    this.reverseMap.clear();
    this.saveCounter();
    this.saveMapping();
  }

  /**
   * Load counter and mappings from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Load counter
      const storedCounter = localStorage.getItem(IDManager.STORAGE_KEY);
      if (storedCounter) {
        this.counter = parseInt(storedCounter, 10) || 1;
      }

      // Load mappings
      const storedMapping = localStorage.getItem(IDManager.ID_MAP_KEY);
      if (storedMapping) {
        const mappingData = JSON.parse(storedMapping);
        this.idMap = new Map(Object.entries(mappingData.longToShort || {}));
        this.reverseMap = new Map(Object.entries(mappingData.shortToLong || {}));
      }
    } catch (error) {
      console.error("Error loading ID manager data from storage:", error);
      // Reset to defaults on error
      this.counter = 1;
      this.idMap.clear();
      this.reverseMap.clear();
    }
  }

  /**
   * Save counter to localStorage
   */
  private saveCounter(): void {
    try {
      localStorage.setItem(IDManager.STORAGE_KEY, this.counter.toString());
    } catch (error) {
      console.error("Error saving ID counter to storage:", error);
    }
  }

  /**
   * Save mappings to localStorage
   */
  private saveMapping(): void {
    try {
      const mappingData = {
        longToShort: Object.fromEntries(this.idMap),
        shortToLong: Object.fromEntries(this.reverseMap)
      };
      localStorage.setItem(IDManager.ID_MAP_KEY, JSON.stringify(mappingData));
    } catch (error) {
      console.error("Error saving ID mappings to storage:", error);
    }
  }
}
