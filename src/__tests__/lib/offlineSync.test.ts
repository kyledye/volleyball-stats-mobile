/**
 * Tests for /lib/offlineSync
 */

import { syncOfflineQueue, hasPendingRequests } from "../../lib/offlineSync";
import {
  getQueue,
  removeFromQueue,
  incrementRetryCount,
  QueuedRequest,
} from "../../lib/offlineQueue";
import { fetchApi } from "../../lib/api";

// Mock dependencies
jest.mock("../../lib/offlineQueue", () => ({
  getQueue: jest.fn(),
  removeFromQueue: jest.fn(),
  incrementRetryCount: jest.fn(),
}));

jest.mock("../../lib/api", () => ({
  fetchApi: jest.fn(),
}));

const mockGetQueue = getQueue as jest.MockedFunction<typeof getQueue>;
const mockRemoveFromQueue = removeFromQueue as jest.MockedFunction<typeof removeFromQueue>;
const mockIncrementRetryCount = incrementRetryCount as jest.MockedFunction<
  typeof incrementRetryCount
>;
const mockFetchApi = fetchApi as jest.MockedFunction<typeof fetchApi>;

describe("syncOfflineQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log/warn/error during tests
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns zeros when queue is empty", async () => {
    mockGetQueue.mockResolvedValue([]);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 0, failed: 0, remaining: 0 });
    expect(mockFetchApi).not.toHaveBeenCalled();
  });

  it("processes a single successful request", async () => {
    const queue: QueuedRequest[] = [
      {
        id: "req-1",
        endpoint: "/api/test",
        method: "POST",
        body: '{"data":"test"}',
        timestamp: 1000,
        retryCount: 0,
      },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue) // Initial fetch
      .mockResolvedValueOnce([]); // After processing
    mockFetchApi.mockResolvedValue({});
    mockRemoveFromQueue.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 1, failed: 0, remaining: 0 });
    expect(mockFetchApi).toHaveBeenCalledWith("/api/test", {
      method: "POST",
      body: '{"data":"test"}',
    });
    expect(mockRemoveFromQueue).toHaveBeenCalledWith("req-1");
  });

  it("processes multiple successful requests", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/2", method: "PUT", timestamp: 2000, retryCount: 0 },
      { id: "req-3", endpoint: "/api/3", method: "DELETE", timestamp: 3000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockResolvedValue({});
    mockRemoveFromQueue.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 3, failed: 0, remaining: 0 });
    expect(mockFetchApi).toHaveBeenCalledTimes(3);
    expect(mockRemoveFromQueue).toHaveBeenCalledTimes(3);
  });

  it("processes requests in timestamp order (oldest first)", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-new", endpoint: "/api/new", method: "POST", timestamp: 3000, retryCount: 0 },
      { id: "req-old", endpoint: "/api/old", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-mid", endpoint: "/api/mid", method: "POST", timestamp: 2000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockResolvedValue({});
    mockRemoveFromQueue.mockResolvedValue(undefined);

    await syncOfflineQueue();

    // Verify order of API calls
    expect(mockFetchApi.mock.calls[0][0]).toBe("/api/old");
    expect(mockFetchApi.mock.calls[1][0]).toBe("/api/mid");
    expect(mockFetchApi.mock.calls[2][0]).toBe("/api/new");
  });

  it("handles failed request with retry increment", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce(queue); // Still in queue after failure
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockIncrementRetryCount.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 0, failed: 1, remaining: 1 });
    expect(mockIncrementRetryCount).toHaveBeenCalledWith("req-1");
    expect(mockRemoveFromQueue).not.toHaveBeenCalled();
  });

  it("removes request after max retries (3)", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 3 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]); // Removed after max retries
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockRemoveFromQueue.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 0, failed: 1, remaining: 0 });
    expect(mockRemoveFromQueue).toHaveBeenCalledWith("req-1");
    expect(mockIncrementRetryCount).not.toHaveBeenCalled();
  });

  it("handles mixed success and failure", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-success-1", endpoint: "/api/success1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-fail", endpoint: "/api/fail", method: "POST", timestamp: 2000, retryCount: 0 },
      { id: "req-success-2", endpoint: "/api/success2", method: "POST", timestamp: 3000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([queue[1]]); // Only failed request remains

    mockFetchApi
      .mockResolvedValueOnce({}) // success1
      .mockRejectedValueOnce(new Error("Network error")) // fail
      .mockResolvedValueOnce({}); // success2

    mockRemoveFromQueue.mockResolvedValue(undefined);
    mockIncrementRetryCount.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 2, failed: 1, remaining: 1 });
  });

  it("handles request without body", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/get", method: "GET", timestamp: 1000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockResolvedValue({});
    mockRemoveFromQueue.mockResolvedValue(undefined);

    await syncOfflineQueue();

    expect(mockFetchApi).toHaveBeenCalledWith("/api/get", {
      method: "GET",
      body: undefined,
    });
  });

  it("logs processing message", async () => {
    const consoleSpy = jest.spyOn(console, "log");
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/test", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/test", method: "POST", timestamp: 2000, retryCount: 0 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockResolvedValue({});
    mockRemoveFromQueue.mockResolvedValue(undefined);

    await syncOfflineQueue();

    expect(consoleSpy).toHaveBeenCalledWith("Processing 2 queued requests...");
  });

  it("logs warning when removing after max retries", async () => {
    const consoleSpy = jest.spyOn(console, "warn");
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 3 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockRemoveFromQueue.mockResolvedValue(undefined);

    await syncOfflineQueue();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Removing request req-1 after 3 failed attempts"
    );
  });
});

describe("hasPendingRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false when queue is empty", async () => {
    mockGetQueue.mockResolvedValue([]);

    const result = await hasPendingRequests();

    expect(result).toBe(false);
  });

  it("returns true when queue has requests", async () => {
    mockGetQueue.mockResolvedValue([
      { id: "req-1", endpoint: "/api/test", method: "POST", timestamp: 1000, retryCount: 0 },
    ]);

    const result = await hasPendingRequests();

    expect(result).toBe(true);
  });

  it("returns true for multiple pending requests", async () => {
    mockGetQueue.mockResolvedValue([
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 0 },
      { id: "req-2", endpoint: "/api/2", method: "POST", timestamp: 2000, retryCount: 0 },
    ]);

    const result = await hasPendingRequests();

    expect(result).toBe(true);
  });
});

describe("retry behavior edge cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles retry count exactly at max (3)", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 3 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockRemoveFromQueue.mockResolvedValue(undefined);

    await syncOfflineQueue();

    expect(mockRemoveFromQueue).toHaveBeenCalledWith("req-1");
    expect(mockIncrementRetryCount).not.toHaveBeenCalled();
  });

  it("increments retry for count below max", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/fail", method: "POST", timestamp: 1000, retryCount: 2 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([{ ...queue[0], retryCount: 3 }]);
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockIncrementRetryCount.mockResolvedValue(undefined);

    await syncOfflineQueue();

    expect(mockIncrementRetryCount).toHaveBeenCalledWith("req-1");
    expect(mockRemoveFromQueue).not.toHaveBeenCalled();
  });

  it("handles all requests at max retry", async () => {
    const queue: QueuedRequest[] = [
      { id: "req-1", endpoint: "/api/1", method: "POST", timestamp: 1000, retryCount: 3 },
      { id: "req-2", endpoint: "/api/2", method: "POST", timestamp: 2000, retryCount: 3 },
    ];
    mockGetQueue
      .mockResolvedValueOnce(queue)
      .mockResolvedValueOnce([]);
    mockFetchApi.mockRejectedValue(new Error("Network error"));
    mockRemoveFromQueue.mockResolvedValue(undefined);

    const result = await syncOfflineQueue();

    expect(result).toEqual({ processed: 0, failed: 2, remaining: 0 });
    expect(mockRemoveFromQueue).toHaveBeenCalledTimes(2);
  });
});
