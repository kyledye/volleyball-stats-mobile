import { fetchApi } from './api';
import { getQueue, removeFromQueue, incrementRetryCount, QueuedRequest } from './offlineQueue';

const MAX_RETRIES = 3;

// Process a single queued request
async function processRequest(request: QueuedRequest): Promise<boolean> {
  try {
    await fetchApi(request.endpoint, {
      method: request.method,
      body: request.body,
    });
    await removeFromQueue(request.id);
    return true;
  } catch (error) {
    console.error(`Failed to process queued request ${request.id}:`, error);

    if (request.retryCount >= MAX_RETRIES) {
      // Remove after max retries
      console.warn(`Removing request ${request.id} after ${MAX_RETRIES} failed attempts`);
      await removeFromQueue(request.id);
      return false;
    }

    await incrementRetryCount(request.id);
    return false;
  }
}

// Process all queued requests
export async function syncOfflineQueue(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  const queue = await getQueue();

  if (queue.length === 0) {
    return { processed: 0, failed: 0, remaining: 0 };
  }

  console.log(`Processing ${queue.length} queued requests...`);

  let processed = 0;
  let failed = 0;

  // Process in order (oldest first)
  const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp);

  for (const request of sorted) {
    const success = await processRequest(request);
    if (success) {
      processed++;
    } else {
      failed++;
    }
  }

  const updatedQueue = await getQueue();

  return {
    processed,
    failed,
    remaining: updatedQueue.length,
  };
}

// Check if there are pending requests
export async function hasPendingRequests(): Promise<boolean> {
  const queue = await getQueue();
  return queue.length > 0;
}
