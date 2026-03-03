/**
 * Tests for /lib/offlineQueue
 */

import {
  getQueue,
  addToQueue,
  removeFromQueue,
  incrementRetryCount,
  clearQueue,
  getQueueSize,
  QueuedRequest,
} from "../../lib/offlineQueue";

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

describe("getQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when no queue exists", async () => {
    mockGetItem.mockResolvedValue(null);

    const queue = await getQueue();

    expect(queue).toEqual([]);
    expect(mockGetItem).toHaveBeenCalledWith("@offline_queue");
  });

  it("returns parsed queue data", async () => {
    const queueData: QueuedRequest[] = [
      {
        id: "req-1",
        endpoint: "/api/test",
        method: "POST",
        body: '{"data":"test"}',
        timestamp: 1234567890,
        retryCount: 0,
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queueData));

    const queue = await getQueue();

    expect(queue).toEqual(queueData);
  });

  it("returns empty array on error", async () => {
    mockGetItem.mockRejectedValue(new Error("Storage error"));

    const queue = await getQueue();

    expect(queue).toEqual([]);
  });

  it("handles multiple requests in queue", async () => {
    const queueData: QueuedRequest[] = [
      {
        id: "req-1",
        endpoint: "/api/test1",
        method: "POST",
        timestamp: 1000,
        retryCount: 0,
      },
      {
        id: "req-2",
        endpoint: "/api/test2",
        method: "PUT",
        timestamp: 2000,
        retryCount: 1,
      },
      {
        id: "req-3",
        endpoint: "/api/test3",
        method: "DELETE",
        timestamp: 3000,
        retryCount: 2,
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queueData));

    const queue = await getQueue();

    expect(queue).toHaveLength(3);
    expect(queue[0].id).toBe("req-1");
    expect(queue[2].retryCount).toBe(2);
  });
});

describe("addToQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    jest.spyOn(Math, "random").mockReturnValue(0.123456789);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("adds a request to empty queue", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await addToQueue({
      endpoint: "/api/test",
      method: "POST",
      body: '{"test":true}',
    });

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData).toHaveLength(1);
    expect(savedData[0].endpoint).toBe("/api/test");
    expect(savedData[0].method).toBe("POST");
    expect(savedData[0].body).toBe('{"test":true}');
    expect(savedData[0].timestamp).toBe(1700000000000);
    expect(savedData[0].retryCount).toBe(0);
  });

  it("adds a request to existing queue", async () => {
    const existingQueue: QueuedRequest[] = [
      {
        id: "existing-1",
        endpoint: "/api/old",
        method: "GET",
        timestamp: 1600000000000,
        retryCount: 0,
      },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(existingQueue));
    mockSetItem.mockResolvedValue(undefined);

    await addToQueue({
      endpoint: "/api/new",
      method: "POST",
    });

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData).toHaveLength(2);
    expect(savedData[0].id).toBe("existing-1");
    expect(savedData[1].endpoint).toBe("/api/new");
  });

  it("generates unique ID for each request", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await addToQueue({ endpoint: "/api/test", method: "POST" });

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData[0].id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it("handles storage error gracefully", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockRejectedValue(new Error("Storage full"));

    // Should not throw
    await expect(
      addToQueue({ endpoint: "/api/test", method: "POST" })
    ).resolves.toBeUndefined();
  });

  it("adds request without body", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await addToQueue({
      endpoint: "/api/test",
      method: "GET",
    });

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData[0].body).toBeUndefined();
  });
});

describe("removeFromQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes a request by ID", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/2", method: "POST", timestamp: 2000, retryCount: 0 },
      { id: "req-3", endpoint: "/api/3", method: "POST", timestamp: 3000, retryCount: 0 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));
    mockSetItem.mockResolvedValue(undefined);

    await removeFromQueue("req-2");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData).toHaveLength(2);
    expect(savedData.map((r: QueuedRequest) => r.id)).toEqual(["req-1", "req-3"]);
  });

  it("handles removing non-existent ID", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));
    mockSetItem.mockResolvedValue(undefined);

    await removeFromQueue("non-existent");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData).toHaveLength(1);
    expect(savedData[0].id).toBe("req-1");
  });

  it("handles empty queue", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    await removeFromQueue("any-id");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData).toEqual([]);
  });

  it("handles storage error gracefully", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockRejectedValue(new Error("Storage error"));

    await expect(removeFromQueue("any-id")).resolves.toBeUndefined();
  });
});

describe("incrementRetryCount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments retry count for a request", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/2", method: "POST", timestamp: 2000, retryCount: 1 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));
    mockSetItem.mockResolvedValue(undefined);

    await incrementRetryCount("req-1");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData[0].retryCount).toBe(1);
    expect(savedData[1].retryCount).toBe(1); // Unchanged
  });

  it("increments from higher count", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 5 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));
    mockSetItem.mockResolvedValue(undefined);

    await incrementRetryCount("req-1");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData[0].retryCount).toBe(6);
  });

  it("does not modify non-matching requests", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));
    mockSetItem.mockResolvedValue(undefined);

    await incrementRetryCount("non-existent");

    const savedData = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedData[0].retryCount).toBe(0);
  });

  it("handles storage error gracefully", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockRejectedValue(new Error("Storage error"));

    await expect(incrementRetryCount("any-id")).resolves.toBeUndefined();
  });
});

describe("clearQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes the queue from storage", async () => {
    mockRemoveItem.mockResolvedValue(undefined);

    await clearQueue();

    expect(mockRemoveItem).toHaveBeenCalledWith("@offline_queue");
  });

  it("handles storage error gracefully", async () => {
    mockRemoveItem.mockRejectedValue(new Error("Storage error"));

    await expect(clearQueue()).resolves.toBeUndefined();
  });
});

describe("getQueueSize", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 0 for empty queue", async () => {
    mockGetItem.mockResolvedValue(null);

    const size = await getQueueSize();

    expect(size).toBe(0);
  });

  it("returns correct count for non-empty queue", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/2", method: "POST", timestamp: 2000, retryCount: 0 },
      { id: "req-3", endpoint: "/api/3", method: "POST", timestamp: 3000, retryCount: 0 },
    ];
    mockGetItem.mockResolvedValue(JSON.stringify(queue));

    const size = await getQueueSize();

    expect(size).toBe(3);
  });

  it("returns 0 on storage error", async () => {
    mockGetItem.mockRejectedValue(new Error("Storage error"));

    const size = await getQueueSize();

    expect(size).toBe(0);
  });
});

describe("QueuedRequest interface", () => {
  it("supports all HTTP methods", async () => {
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);

    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

    for (const method of methods) {
      await addToQueue({ endpoint: "/api/test", method });
    }

    expect(mockSetItem).toHaveBeenCalledTimes(5);
  });
});

describe("integration scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("simulates queue lifecycle", async () => {
    // Start with empty queue
    mockGetItem.mockResolvedValueOnce(null);
    mockSetItem.mockResolvedValue(undefined);

    // Add first request
    await addToQueue({ endpoint: "/api/users", method: "POST", body: '{"name":"Test"}' });

    // Add second request (queue now has 1 item)
    const afterFirst = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    mockGetItem.mockResolvedValueOnce(JSON.stringify(afterFirst));

    await addToQueue({ endpoint: "/api/teams", method: "POST", body: '{"name":"Team A"}' });

    const afterSecond = JSON.parse(mockSetItem.mock.calls[1][1] as string);
    expect(afterSecond).toHaveLength(2);

    // Remove first request
    mockGetItem.mockResolvedValueOnce(JSON.stringify(afterSecond));
    await removeFromQueue(afterSecond[0].id);

    const afterRemove = JSON.parse(mockSetItem.mock.calls[2][1] as string);
    expect(afterRemove).toHaveLength(1);
    expect(afterRemove[0].endpoint).toBe("/api/teams");
  });

  it("handles retry scenario", async () => {
    const initialQueue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 0 },
    ];

    // First failure
    mockGetItem.mockResolvedValueOnce(JSON.stringify(initialQueue));
    mockSetItem.mockResolvedValue(undefined);
    await incrementRetryCount("req-1");

    let savedQueue = JSON.parse(mockSetItem.mock.calls[0][1] as string);
    expect(savedQueue[0].retryCount).toBe(1);

    // Second failure
    mockGetItem.mockResolvedValueOnce(JSON.stringify(savedQueue));
    await incrementRetryCount("req-1");

    savedQueue = JSON.parse(mockSetItem.mock.calls[1][1] as string);
    expect(savedQueue[0].retryCount).toBe(2);

    // Third failure
    mockGetItem.mockResolvedValueOnce(JSON.stringify(savedQueue));
    await incrementRetryCount("req-1");

    savedQueue = JSON.parse(mockSetItem.mock.calls[2][1] as string);
    expect(savedQueue[0].retryCount).toBe(3);
  });
});
