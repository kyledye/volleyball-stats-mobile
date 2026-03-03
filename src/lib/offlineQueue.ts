import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@offline_queue';

export interface QueuedRequest {
  id: string;
  endpoint: string;
  method: string;
  body?: string;
  timestamp: number;
  retryCount: number;
}

// Get all queued requests
export async function getQueue(): Promise<QueuedRequest[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
}

// Add a request to the queue
export async function addToQueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
  try {
    const queue = await getQueue();
    const newRequest: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    queue.push(newRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Failed to add to offline queue:', error);
  }
}

// Remove a request from the queue
export async function removeFromQueue(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const filtered = queue.filter(r => r.id !== id);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove from offline queue:', error);
  }
}

// Update retry count for a request
export async function incrementRetryCount(id: string): Promise<void> {
  try {
    const queue = await getQueue();
    const updated = queue.map(r =>
      r.id === id ? { ...r, retryCount: r.retryCount + 1 } : r
    );
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update retry count:', error);
  }
}

// Clear the entire queue
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
  } catch (error) {
    console.error('Failed to clear offline queue:', error);
  }
}

// Get queue size
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
