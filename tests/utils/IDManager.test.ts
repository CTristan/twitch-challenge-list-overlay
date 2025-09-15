import { beforeEach, describe, expect, it, vi } from "vitest";
import IDManager from "../../src/utils/IDManager";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe("IDManager", () => {
  let idManager: IDManager;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    // Reset singleton instance
    (IDManager as any).instance = null;
    
    idManager = IDManager.getInstance();
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = IDManager.getInstance();
      const instance2 = IDManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe("ID generation", () => {
    it("should generate sequential base36 IDs", () => {
      const id1 = idManager.generateNewId();
      const id2 = idManager.generateNewId();
      const id3 = idManager.generateNewId();
      
      expect(id1).toBe("1");
      expect(id2).toBe("2");
      expect(id3).toBe("3");
    });

    it("should generate base36 IDs correctly", () => {
      // Generate enough IDs to test base36 conversion
      const ids: string[] = [];
      for (let i = 0; i < 40; i++) {
        ids.push(idManager.generateNewId());
      }
      
      expect(ids[0]).toBe("1");
      expect(ids[9]).toBe("A"); // 10 in base36
      expect(ids[34]).toBe("Z"); // 35 in base36 (since we start from 1, not 0)
      expect(ids[35]).toBe("10"); // 36 in base36
    });
  });

  describe("ID mapping", () => {
    it("should create mapping for long IDs", () => {
      const longId = "1234567890123456789";
      const shortId = idManager.getShortId(longId);
      
      expect(shortId).toBe("1");
      expect(idManager.getLongId(shortId)).toBe(longId);
    });

    it("should return existing mapping for same long ID", () => {
      const longId = "1234567890123456789";
      const shortId1 = idManager.getShortId(longId);
      const shortId2 = idManager.getShortId(longId);
      
      expect(shortId1).toBe(shortId2);
    });

    it("should handle multiple mappings", () => {
      const longId1 = "1111111111111111111";
      const longId2 = "2222222222222222222";
      const longId3 = "3333333333333333333";
      
      const shortId1 = idManager.getShortId(longId1);
      const shortId2 = idManager.getShortId(longId2);
      const shortId3 = idManager.getShortId(longId3);
      
      expect(shortId1).toBe("1");
      expect(shortId2).toBe("2");
      expect(shortId3).toBe("3");
      
      expect(idManager.getLongId(shortId1)).toBe(longId1);
      expect(idManager.getLongId(shortId2)).toBe(longId2);
      expect(idManager.getLongId(shortId3)).toBe(longId3);
    });

    it("should return null for non-existent short ID", () => {
      expect(idManager.getLongId("Z")).toBeNull();
    });
  });

  describe("ID validation", () => {
    it("should validate correct short ID formats", () => {
      expect(idManager.isValidShortIdFormat("1")).toBe(true);
      expect(idManager.isValidShortIdFormat("A")).toBe(true);
      expect(idManager.isValidShortIdFormat("Z")).toBe(true);
      expect(idManager.isValidShortIdFormat("10")).toBe(true);
      expect(idManager.isValidShortIdFormat("ABC")).toBe(true);
    });

    it("should reject invalid short ID formats", () => {
      expect(idManager.isValidShortIdFormat("")).toBe(false);
      expect(idManager.isValidShortIdFormat("@")).toBe(false);
      expect(idManager.isValidShortIdFormat("1234")).toBe(false); // Too long
      expect(idManager.isValidShortIdFormat("A-B")).toBe(false);
    });

    it("should be case insensitive for validation", () => {
      expect(idManager.isValidShortIdFormat("a")).toBe(true);
      expect(idManager.isValidShortIdFormat("z")).toBe(true);
      expect(idManager.isValidShortIdFormat("abc")).toBe(true);
    });
  });

  describe("ID existence check", () => {
    it("should check if short ID exists", () => {
      const longId = "1234567890123456789";
      const shortId = idManager.getShortId(longId);
      
      expect(idManager.hasShortId(shortId)).toBe(true);
      expect(idManager.hasShortId("Z")).toBe(false);
    });

    it("should be case insensitive for existence check", () => {
      const longId = "1234567890123456789";
      const shortId = idManager.getShortId(longId);
      
      expect(idManager.hasShortId(shortId.toLowerCase())).toBe(true);
    });
  });

  describe("mapping removal", () => {
    it("should remove mapping correctly", () => {
      const longId = "1234567890123456789";
      const shortId = idManager.getShortId(longId);
      
      expect(idManager.hasShortId(shortId)).toBe(true);
      
      idManager.removeMapping(longId);
      
      expect(idManager.hasShortId(shortId)).toBe(false);
      expect(idManager.getLongId(shortId)).toBeNull();
    });

    it("should handle removal of non-existent mapping", () => {
      expect(() => idManager.removeMapping("nonexistent")).not.toThrow();
    });
  });

  describe("reset functionality", () => {
    it("should reset all mappings and counter", () => {
      // Create some mappings
      idManager.getShortId("long1");
      idManager.getShortId("long2");
      
      // Reset
      idManager.reset();
      
      // Next ID should be 1 again
      const newId = idManager.generateNewId();
      expect(newId).toBe("1");
      
      // Old mappings should be gone
      expect(idManager.hasShortId("1")).toBe(false);
      expect(idManager.hasShortId("2")).toBe(false);
    });
  });

  describe("localStorage integration", () => {
    it("should save counter to localStorage", () => {
      idManager.generateNewId();
      idManager.generateNewId();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "challenge_id_counter",
        "3" // Next counter value
      );
    });

    it("should save mappings to localStorage", () => {
      const longId = "1234567890123456789";
      idManager.getShortId(longId);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "challenge_id_mapping",
        expect.stringContaining(longId)
      );
    });

    it("should load counter from localStorage", () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "challenge_id_counter") return "5";
        return null;
      });
      
      // Create new instance to trigger loading
      (IDManager as any).instance = null;
      const newManager = IDManager.getInstance();
      
      const nextId = newManager.generateNewId();
      expect(nextId).toBe("5");
    });

    it("should load mappings from localStorage", () => {
      const mappingData = {
        longToShort: { "long123": "A" },
        shortToLong: { "A": "long123" }
      };
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "challenge_id_mapping") return JSON.stringify(mappingData);
        return null;
      });
      
      // Create new instance to trigger loading
      (IDManager as any).instance = null;
      const newManager = IDManager.getInstance();
      
      expect(newManager.getLongId("A")).toBe("long123");
      expect(newManager.hasShortId("A")).toBe(true);
    });

    it("should handle localStorage errors gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("localStorage error");
      });
      
      // Should not throw
      expect(() => {
        (IDManager as any).instance = null;
        IDManager.getInstance();
      }).not.toThrow();
    });
  });

  describe("getAllMappings", () => {
    it("should return all current mappings", () => {
      const longId1 = "long1";
      const longId2 = "long2";
      
      const shortId1 = idManager.getShortId(longId1);
      const shortId2 = idManager.getShortId(longId2);
      
      const mappings = idManager.getAllMappings();
      
      expect(mappings.longToShort[longId1]).toBe(shortId1);
      expect(mappings.longToShort[longId2]).toBe(shortId2);
      expect(mappings.shortToLong[shortId1]).toBe(longId1);
      expect(mappings.shortToLong[shortId2]).toBe(longId2);
    });
  });
});
