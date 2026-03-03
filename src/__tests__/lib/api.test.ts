/**
 * Tests for /lib/api
 */

import { ApiError, buildQueryString, fetchApi } from "../../lib/api";

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock config
jest.mock("../../lib/config", () => ({
  config: { apiUrl: "https://api.example.com" },
  isDev: false,
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("ApiError", () => {
  it("creates error with message and status", () => {
    const error = new ApiError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.status).toBe(404);
    expect(error.name).toBe("ApiError");
  });

  it("creates error with data", () => {
    const errorData = { field: "email", reason: "invalid" };
    const error = new ApiError("Validation failed", 400, errorData);
    expect(error.message).toBe("Validation failed");
    expect(error.status).toBe(400);
    expect(error.data).toEqual(errorData);
  });

  it("is an instance of Error", () => {
    const error = new ApiError("Server error", 500);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it("has correct name property", () => {
    const error = new ApiError("Test error", 400);
    expect(error.name).toBe("ApiError");
  });
});

describe("buildQueryString", () => {
  it("returns empty string for empty params", () => {
    expect(buildQueryString({})).toBe("");
  });

  it("builds query string from single param", () => {
    expect(buildQueryString({ foo: "bar" })).toBe("?foo=bar");
  });

  it("builds query string from multiple params", () => {
    const result = buildQueryString({ foo: "bar", baz: "qux" });
    expect(result).toContain("foo=bar");
    expect(result).toContain("baz=qux");
    expect(result.startsWith("?")).toBe(true);
  });

  it("ignores undefined values", () => {
    expect(buildQueryString({ foo: "bar", baz: undefined })).toBe("?foo=bar");
  });

  it("ignores all undefined values", () => {
    expect(buildQueryString({ foo: undefined, baz: undefined })).toBe("");
  });

  it("handles number values", () => {
    expect(buildQueryString({ page: 1, limit: 10 })).toContain("page=1");
    expect(buildQueryString({ page: 1, limit: 10 })).toContain("limit=10");
  });

  it("handles boolean values", () => {
    expect(buildQueryString({ active: true })).toBe("?active=true");
    expect(buildQueryString({ active: false })).toBe("?active=false");
  });

  it("encodes special characters", () => {
    const result = buildQueryString({ name: "John Doe" });
    expect(result).toBe("?name=John+Doe");
  });

  it("handles empty string values", () => {
    expect(buildQueryString({ foo: "" })).toBe("?foo=");
  });

  it("handles mixed types", () => {
    const result = buildQueryString({
      name: "test",
      page: 1,
      active: true,
      deleted: undefined,
    });
    expect(result).toContain("name=test");
    expect(result).toContain("page=1");
    expect(result).toContain("active=true");
    expect(result).not.toContain("deleted");
  });
});

describe("fetchApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("makes a successful GET request", async () => {
    const mockData = { id: "1", name: "Test" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockData,
    });

    const result = await fetchApi<typeof mockData>("/test");

    expect(result).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("makes a POST request with body", async () => {
    const requestData = { name: "New Item" };
    const responseData = { id: "1", name: "New Item" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => responseData,
    });

    const result = await fetchApi<typeof responseData>("/test", {
      method: "POST",
      body: JSON.stringify(requestData),
    });

    expect(result).toEqual(responseData);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(requestData),
      })
    );
  });

  it("throws ApiError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Not found" }),
    });

    try {
      await fetchApi("/test");
      fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).status).toBe(404);
    }
  });

  it("throws ApiError with message from response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ error: "Invalid data" }),
    });

    try {
      await fetchApi("/test");
      fail("Should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe("Invalid data");
      expect((e as ApiError).status).toBe(400);
    }
  });

  it("handles non-JSON responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "text/plain" }),
    });

    const result = await fetchApi("/test");
    expect(result).toEqual({});
  });

  it("throws ApiError for non-JSON error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "text/plain" }),
    });

    await expect(fetchApi("/test")).rejects.toThrow(ApiError);
  });

  it("makes a PATCH request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ updated: true }),
    });

    await fetchApi("/test/1", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/test/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Updated" }),
      })
    );
  });

  it("makes a DELETE request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({}),
    });

    await fetchApi("/test/1", {
      method: "DELETE",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/test/1",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("includes custom headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({}),
    });

    await fetchApi("/test", {
      headers: {
        "X-Custom-Header": "custom-value",
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Custom-Header": "custom-value",
        }),
      })
    );
  });
});

describe("fetchApi with auth token", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("includes auth token in header when available", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockResolvedValueOnce("test-token-123");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ data: "test" }),
    });

    await fetchApi("/protected");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/protected",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token-123",
        }),
      })
    );
  });

  it("does not include auth header when no token", async () => {
    const SecureStore = require("expo-secure-store");
    SecureStore.getItemAsync.mockResolvedValueOnce(null);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ data: "test" }),
    });

    await fetchApi("/public");

    const callArgs = mockFetch.mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });
});
