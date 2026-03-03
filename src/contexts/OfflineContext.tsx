import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { syncOfflineQueue, hasPendingRequests } from '../lib/offlineSync';
import { addToQueue, getQueueSize } from '../lib/offlineQueue';

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  queueRequest: (endpoint: string, method: string, body?: string) => Promise<void>;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Determine if truly online
  const isOnline = isConnected && isInternetReachable !== false;

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getQueueSize();
    setPendingCount(count);
  }, []);

  // Queue a request for later
  const queueRequest = useCallback(async (endpoint: string, method: string, body?: string) => {
    await addToQueue({ endpoint, method, body });
    await updatePendingCount();
  }, [updatePendingCount]);

  // Sync queued requests
  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      console.log('Sync result:', result);
      await updatePendingCount();
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, updatePendingCount]);

  // Check for pending requests on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      hasPendingRequests().then(hasPending => {
        if (hasPending) {
          syncNow();
        }
      });
    }
  }, [isOnline, syncNow]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        queueRequest,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
