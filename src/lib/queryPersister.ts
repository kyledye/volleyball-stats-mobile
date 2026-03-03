import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const CACHE_KEY = '@query_cache';

// Create an AsyncStorage persister for TanStack Query
export function createAsyncStoragePersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client));
      } catch (error) {
        console.error('Failed to persist query cache:', error);
      }
    },
    restoreClient: async (): Promise<PersistedClient | undefined> => {
      try {
        const data = await AsyncStorage.getItem(CACHE_KEY);
        return data ? JSON.parse(data) : undefined;
      } catch (error) {
        console.error('Failed to restore query cache:', error);
        return undefined;
      }
    },
    removeClient: async () => {
      try {
        await AsyncStorage.removeItem(CACHE_KEY);
      } catch (error) {
        console.error('Failed to remove query cache:', error);
      }
    },
  };
}
