/**
 * Tests for /lib/queryPersister
 */

import { createAsyncStoragePersister } from "../../lib/queryPersister";
import { PersistedClient } from "@tanstack/react-query-persist-client";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";

const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<
  typeof AsyncStorage.getItem
>;
const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<
  typeof AsyncStorage.setItem
>;
const mockRemoveItem = AsyncStorage.removeItem as jest.MockedFunction<
  typeof AsyncStorage.removeItem
>;

describe("createAsyncStoragePersister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns a persister object with required methods", () => {
    const persister = createAsyncStoragePersister();

    expect(persister).toHaveProperty("persistClient");
    expect(persister).toHaveProperty("restoreClient");
    expect(persister).toHaveProperty("removeClient");
    expect(typeof persister.persistClient).toBe("function");
    expect(typeof persister.restoreClient).toBe("function");
    expect(typeof persister.removeClient).toBe("function");
  });

  describe("persistClient", () => {
    it("saves client to AsyncStorage", async () => {
      mockSetItem.mockResolvedValue(undefined);
      const persister = createAsyncStoragePersister();

      const client: PersistedClient = {
        timestamp: 1700000000000,
        buster: "v1",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      await persister.persistClient(client);

      expect(mockSetItem).toHaveBeenCalledWith(
        "@query_cache",
        JSON.stringify(client)
      );
    });

    it("handles storage error gracefully", async () => {
      mockSetItem.mockRejectedValue(new Error("Storage full"));
      const persister = createAsyncStoragePersister();

      const client: PersistedClient = {
        timestamp: 1700000000000,
        buster: "v1",
        clientState: { queries: [], mutations: [] },
      };

      // Should not throw
      await expect(persister.persistClient(client)).resolves.toBeUndefined();
    });

    it("logs error on failure", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      mockSetItem.mockRejectedValue(new Error("Storage full"));
      const persister = createAsyncStoragePersister();

      await persister.persistClient({
        timestamp: 0,
        buster: "",
        clientState: { queries: [], mutations: [] },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to persist query cache:",
        expect.any(Error)
      );
    });

    it("persists complex client state", async () => {
      mockSetItem.mockResolvedValue(undefined);
      const persister = createAsyncStoragePersister();

      const client: PersistedClient = {
        timestamp: 1700000000000,
        buster: "v2",
        clientState: {
          queries: [
            {
              queryKey: ["teams"],
              queryHash: '["teams"]',
              state: {
                data: [{ id: "1", name: "Team A" }],
                dataUpdateCount: 1,
                dataUpdatedAt: 1700000000000,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: false,
                status: "success",
                fetchStatus: "idle",
              },
            },
          ],
          mutations: [],
        },
      };

      await persister.persistClient(client);

      const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
      expect(savedData.clientState.queries).toHaveLength(1);
      expect(savedData.clientState.queries[0].queryKey).toEqual(["teams"]);
    });
  });

  describe("restoreClient", () => {
    it("returns undefined when no cache exists", async () => {
      mockGetItem.mockResolvedValue(null);
      const persister = createAsyncStoragePersister();

      const result = await persister.restoreClient();

      expect(result).toBeUndefined();
      expect(mockGetItem).toHaveBeenCalledWith("@query_cache");
    });

    it("returns parsed client from cache", async () => {
      const cachedClient: PersistedClient = {
        timestamp: 1700000000000,
        buster: "v1",
        clientState: {
          queries: [
            {
              queryKey: ["users"],
              queryHash: '["users"]',
              state: {
                data: [{ id: "user-1", name: "John" }],
                dataUpdateCount: 1,
                dataUpdatedAt: 1700000000000,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: false,
                status: "success",
                fetchStatus: "idle",
              },
            },
          ],
          mutations: [],
        },
      };
      mockGetItem.mockResolvedValue(JSON.stringify(cachedClient));
      const persister = createAsyncStoragePersister();

      const result = await persister.restoreClient();

      expect(result).toEqual(cachedClient);
    });

    it("returns undefined on storage error", async () => {
      mockGetItem.mockRejectedValue(new Error("Storage corrupted"));
      const persister = createAsyncStoragePersister();

      const result = await persister.restoreClient();

      expect(result).toBeUndefined();
    });

    it("logs error on failure", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      mockGetItem.mockRejectedValue(new Error("Storage corrupted"));
      const persister = createAsyncStoragePersister();

      await persister.restoreClient();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to restore query cache:",
        expect.any(Error)
      );
    });
  });

  describe("removeClient", () => {
    it("removes cache from AsyncStorage", async () => {
      mockRemoveItem.mockResolvedValue(undefined);
      const persister = createAsyncStoragePersister();

      await persister.removeClient();

      expect(mockRemoveItem).toHaveBeenCalledWith("@query_cache");
    });

    it("handles storage error gracefully", async () => {
      mockRemoveItem.mockRejectedValue(new Error("Storage error"));
      const persister = createAsyncStoragePersister();

      // Should not throw
      await expect(persister.removeClient()).resolves.toBeUndefined();
    });

    it("logs error on failure", async () => {
      const consoleSpy = jest.spyOn(console, "error");
      mockRemoveItem.mockRejectedValue(new Error("Storage error"));
      const persister = createAsyncStoragePersister();

      await persister.removeClient();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to remove query cache:",
        expect.any(Error)
      );
    });
  });
});

describe("persister integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("can persist and restore client", async () => {
    const persister = createAsyncStoragePersister();

    const client: PersistedClient = {
      timestamp: 1700000000000,
      buster: "test",
      clientState: { queries: [], mutations: [] },
    };

    // Persist
    mockSetItem.mockResolvedValue(undefined);
    await persister.persistClient(client);

    // Mock restored data
    mockGetItem.mockResolvedValue(JSON.stringify(client));

    // Restore
    const restored = await persister.restoreClient();

    expect(restored).toEqual(client);
  });

  it("handles full lifecycle", async () => {
    const persister = createAsyncStoragePersister();
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);
    mockGetItem.mockResolvedValue(null);

    // Initially empty
    let result = await persister.restoreClient();
    expect(result).toBeUndefined();

    // Persist data
    const client: PersistedClient = {
      timestamp: Date.now(),
      buster: "v1",
      clientState: { queries: [], mutations: [] },
    };
    await persister.persistClient(client);
    expect(mockSetItem).toHaveBeenCalled();

    // Remove
    await persister.removeClient();
    expect(mockRemoveItem).toHaveBeenCalled();
  });
});

describe("cache key", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses consistent cache key across operations", async () => {
    const persister = createAsyncStoragePersister();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
    mockRemoveItem.mockResolvedValue(undefined);

    await persister.restoreClient();
    await persister.persistClient({
      timestamp: 0,
      buster: "",
      clientState: { queries: [], mutations: [] },
    });
    await persister.removeClient();

    expect(mockGetItem).toHaveBeenCalledWith("@query_cache");
    expect(mockSetItem).toHaveBeenCalledWith("@query_cache", expect.any(String));
    expect(mockRemoveItem).toHaveBeenCalledWith("@query_cache");
  });
});
