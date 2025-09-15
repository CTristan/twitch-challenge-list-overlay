import { beforeEach, describe, expect, it, vi } from "vitest";
import EventEmitter from "../../src/twitch/EventEmitter";

describe("EventEmitter", () => {
  /** @type EventEmitter */
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
  });

  it("should add a listener and emit an event", () => {
    const eventName = "testEvent";
    const listener = vi.fn();

    eventEmitter.on(eventName, listener);
    eventEmitter.emit(eventName);

    expect(listener).toHaveBeenCalled();
  });

  it("should remove a listener from an event", () => {
    const eventName = "testEvent";
    const listener = vi.fn();

    eventEmitter.on(eventName, listener);
    eventEmitter.off(eventName, listener);
    eventEmitter.emit(eventName);

    expect(listener).not.toHaveBeenCalled();
  });

  it("should add a listener that will only be called once", () => {
    const eventName = "testEvent";
    const listener = vi.fn();

    eventEmitter.once(eventName, listener);
    eventEmitter.emit(eventName);
    eventEmitter.emit(eventName);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("should not throw an error when removing a non-existent listener", () => {
    const eventName = "testEvent";
    const listener = vi.fn();

    expect(() => eventEmitter.off(eventName, listener)).not.toThrow();
  });

  it("should not throw an error when emitting an event with no listeners", () => {
    const eventName = "testEvent";

    expect(() => eventEmitter.emit(eventName)).not.toThrow();
  });
});
