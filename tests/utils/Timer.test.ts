import { beforeEach, describe, expect, it, vi } from "vitest";
import Timer from "../../src/utils/Timer";

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("parseDuration", () => {
    it("should parse seconds format", () => {
      expect(Timer.parseDuration("90s")).toBe(90);
      expect(Timer.parseDuration("30s")).toBe(30);
    });

    it("should parse minutes format", () => {
      expect(Timer.parseDuration("10m")).toBe(600);
      expect(Timer.parseDuration("5m")).toBe(300);
    });

    it("should parse hours format", () => {
      expect(Timer.parseDuration("1h")).toBe(3600);
      expect(Timer.parseDuration("2h")).toBe(7200);
    });

    it("should parse combined format", () => {
      expect(Timer.parseDuration("1h30m")).toBe(5400); // 1 hour + 30 minutes
      expect(Timer.parseDuration("1h30m45s")).toBe(5445); // 1 hour + 30 minutes + 45 seconds
      expect(Timer.parseDuration("25m30s")).toBe(1530); // 25 minutes + 30 seconds
    });

    it("should parse clock format mm:ss", () => {
      expect(Timer.parseDuration("12:30")).toBe(750); // 12 minutes 30 seconds
      expect(Timer.parseDuration("05:00")).toBe(300); // 5 minutes
    });

    it("should parse clock format hh:mm:ss", () => {
      expect(Timer.parseDuration("1:30:45")).toBe(5445); // 1 hour 30 minutes 45 seconds
      expect(Timer.parseDuration("0:05:30")).toBe(330); // 5 minutes 30 seconds
    });

    it("should handle case insensitive input", () => {
      expect(Timer.parseDuration("10M")).toBe(600);
      expect(Timer.parseDuration("1H30M")).toBe(5400);
    });

    it("should throw error for invalid format", () => {
      expect(() => Timer.parseDuration("invalid")).toThrow("Invalid timer format");
      expect(() => Timer.parseDuration("")).toThrow("Timer duration must be a string");
      expect(() => Timer.parseDuration("10x")).toThrow("Invalid timer format");
    });

    it("should throw error for invalid clock format", () => {
      expect(() => Timer.parseDuration("25:70")).toThrow("Invalid time values");
      expect(() => Timer.parseDuration("1:70:30")).toThrow("Invalid time values");
      expect(() => Timer.parseDuration("1:30:70")).toThrow("Invalid time values");
    });

    it("should throw error for zero duration", () => {
      expect(() => Timer.parseDuration("0s")).toThrow("Timer duration must be greater than 0");
    });

    it("should throw error for negative values", () => {
      expect(() => Timer.parseDuration("-5m")).toThrow("Invalid duration value");
    });
  });

  describe("Timer functionality", () => {
    let timer: Timer;

    beforeEach(() => {
      timer = new Timer(300); // 300 seconds (5 minutes) for better testing
    });

    it("should initialize with correct properties", () => {
      expect(timer.duration).toBe(300);
      expect(timer.isActive).toBe(false);
      expect(timer.isPaused).toBe(false);
    });

    it("should start timer correctly", () => {
      const startTime = Date.now();
      timer.start();

      expect(timer.isActive).toBe(true);
      expect(timer.isPaused).toBe(false);
      expect(timer.startTime).toBe(startTime);
      expect(timer.endTime).toBe(startTime + 300000);
    });

    it("should calculate remaining time correctly", () => {
      timer.start();
      
      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      expect(timer.getRemainingTime()).toBe(270);
    });

    it("should detect expiration", () => {
      timer.start();
      
      // Advance time beyond duration
      vi.advanceTimersByTime(310000);

      expect(timer.isExpired()).toBe(true);
      expect(timer.getRemainingTime()).toBe(0);
    });

    it("should pause and resume correctly", () => {
      timer.start();
      
      // Advance 20 seconds, then pause
      vi.advanceTimersByTime(20000);
      timer.pause();
      
      expect(timer.isPaused).toBe(true);
      expect(timer.getRemainingTime()).toBe(280);

      // Advance 10 seconds while paused (should not affect remaining time)
      vi.advanceTimersByTime(10000);
      expect(timer.getRemainingTime()).toBe(280);

      // Resume
      timer.resume();
      expect(timer.isPaused).toBe(false);

      // Advance 20 more seconds
      vi.advanceTimersByTime(20000);
      expect(timer.getRemainingTime()).toBe(260);
    });

    it("should stop timer correctly", () => {
      timer.start();
      vi.advanceTimersByTime(30000);
      
      timer.stop();
      
      expect(timer.isActive).toBe(false);
      expect(timer.isPaused).toBe(false);
      expect(timer.getRemainingTime()).toBe(0);
    });

    it("should format time correctly", () => {
      expect(timer.getFormattedTime(0)).toBe("0s");
      expect(timer.getFormattedTime(30)).toBe("30s");
      expect(timer.getFormattedTime(90)).toBe("1m 30s");
      expect(timer.getFormattedTime(3661)).toBe("1h 1m 1s");
      expect(timer.getFormattedTime(3600)).toBe("1h");
      expect(timer.getFormattedTime(60)).toBe("1m");
    });

    it("should provide correct status display", () => {
      // Not active
      expect(timer.getStatusDisplay()).toBe("");
      
      // Active, normal time
      timer.start();
      expect(timer.getStatusDisplay()).toBe("⏱️");
      
      // Warning time (2 minutes)
      vi.advanceTimersByTime(182000); // 182 seconds elapsed, 118 seconds remaining
      expect(timer.getStatusDisplay()).toBe("🟡");

      // Critical time (30 seconds)
      vi.advanceTimersByTime(89000); // 271 seconds elapsed, 29 seconds remaining
      expect(timer.getStatusDisplay()).toBe("🔴");
      
      // Expired
      vi.advanceTimersByTime(30000); // Advance enough to expire
      expect(timer.getStatusDisplay()).toBe("⏰");
      
      // Paused
      timer = new Timer(300);
      timer.start();
      timer.pause();
      expect(timer.getStatusDisplay()).toBe("⏸️");
    });
  });

  describe("serialization", () => {
    it("should serialize and deserialize correctly", () => {
      const timer = new Timer(120);
      timer.start();
      
      const data = timer.toData();
      const newTimer = Timer.fromData(data);
      
      expect(newTimer.duration).toBe(timer.duration);
      expect(newTimer.startTime).toBe(timer.startTime);
      expect(newTimer.endTime).toBe(timer.endTime);
      expect(newTimer.isActive).toBe(timer.isActive);
      expect(newTimer.isPaused).toBe(timer.isPaused);
    });
  });
});
