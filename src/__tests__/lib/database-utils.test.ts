/**
 * Tests for database utility functions
 */

import { generateId } from "../../lib/database";

// Mock expo-sqlite to avoid database initialization during import
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(),
}));

describe("generateId", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    jest.spyOn(Math, "random").mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates an ID with local_ prefix", () => {
    const id = generateId();

    expect(id).toMatch(/^local_/);
  });

  it("includes timestamp in the ID", () => {
    const id = generateId();

    expect(id).toContain("1700000000000");
  });

  it("includes random suffix", () => {
    const id = generateId();

    expect(id).toMatch(/^local_\d+_[a-z0-9]+$/);
  });

  it("generates unique IDs with different timestamps", () => {
    jest.spyOn(Date, "now")
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000);

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(id1).toContain("1000");
    expect(id2).toContain("2000");
  });

  it("generates unique IDs with different random values", () => {
    jest.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0.9);

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
  });

  it("generates valid string ID", () => {
    const id = generateId();

    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("generates ID with expected format", () => {
    const id = generateId();

    // Format: local_<timestamp>_<random>
    const parts = id.split("_");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe("local");
    expect(parseInt(parts[1])).toBe(1700000000000);
    expect(parts[2].length).toBeGreaterThan(0);
  });
});

describe("generateId integration", () => {
  it("generates unique IDs in quick succession", () => {
    jest.restoreAllMocks(); // Use real Date.now and Math.random

    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }

    // All IDs should be unique
    expect(ids.size).toBe(100);
  });

  it("generates IDs suitable for database keys", () => {
    jest.restoreAllMocks();

    const id = generateId();

    // Should be a valid non-empty string
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(10);

    // Should not contain special characters that might cause issues
    expect(id).toMatch(/^[a-zA-Z0-9_]+$/);
  });
});
