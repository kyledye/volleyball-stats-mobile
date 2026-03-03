/**
 * Tests for /lib/queryClient
 */

import { getQueryClient } from "../../lib/queryClient";
import { QueryClient } from "@tanstack/react-query";

// Mock window for browser environment testing
const originalWindow = global.window;

describe("queryClient", () => {
  afterEach(() => {
    // Reset window
    global.window = originalWindow;
  });

  describe("getQueryClient", () => {
    it("returns a QueryClient instance", () => {
      const client = getQueryClient();
      expect(client).toBeInstanceOf(QueryClient);
    });

    it("returns the same instance on subsequent calls in browser", () => {
      // Ensure we're in browser mode
      global.window = {} as Window & typeof globalThis;

      const client1 = getQueryClient();
      const client2 = getQueryClient();
      expect(client1).toBe(client2);
    });

    it("has default staleTime of 1 minute", () => {
      const client = getQueryClient();
      const options = client.getDefaultOptions();
      expect(options.queries?.staleTime).toBe(60 * 1000);
    });

    it("has retry set to 1 for queries", () => {
      const client = getQueryClient();
      const options = client.getDefaultOptions();
      expect(options.queries?.retry).toBe(1);
    });

    it("has refetchOnWindowFocus disabled", () => {
      const client = getQueryClient();
      const options = client.getDefaultOptions();
      expect(options.queries?.refetchOnWindowFocus).toBe(false);
    });

    it("has retry set to 1 for mutations", () => {
      const client = getQueryClient();
      const options = client.getDefaultOptions();
      expect(options.mutations?.retry).toBe(1);
    });
  });
});
