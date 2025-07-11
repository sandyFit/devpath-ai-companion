/**
 * This hook will:
 * - Call fetchProjectData, fetchAnalyses, fetchAnalyticsSummary, and fetchLearningPaths
 * - Manage the refreshing state
 * - Handle setError and retry fallback if needed
 * - No caching - always forces fresh data
 */

import { useState, useCallback } from 'react';

const MAX_RETRIES = 3;

export default function useRefreshData({
  projectId,
  fetchProjectData,
  fetchAnalyses,
  fetchAnalyticsSummary,
  fetchLearningPaths,
  setError
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const refreshData = useCallback(async () => {
    if (!projectId) return;

    setRefreshing(true);
    setError(null);

    try {
      const results = await Promise.allSettled([
        fetchProjectData(true),
        fetchAnalyses(true),
        fetchAnalyticsSummary(true),
        fetchLearningPaths(true)
      ]);

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn('Some refresh operations failed:', failed);
      }

      setRetryCount(0);
    } catch (err) {
      console.error('Refresh failed:', err);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(refreshData, 1000 * (retryCount + 1));
        return;
      }
    } finally {
      setRefreshing(false);
    }
  }, [
    projectId,
    fetchProjectData,
    fetchAnalyses,
    fetchAnalyticsSummary,
    fetchLearningPaths,
    retryCount,
    setError
  ]);

  return { refreshing, refreshData };
}
