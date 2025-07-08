/**
 * This hook manages:
 * - Fetching learning paths
 * - Force-refreshing/generating new paths
 * - Error and loading state
 * - Graceful 404 fallback (learning paths may not exist yet)
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const CACHE_DURATION = 5 * 60 * 1000;

export default function useLearningPaths(projectId, setLoadingState) {
  const [learningPaths, setLearningPaths] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const handleApiError = useApiError();

  const isCacheValid = useCallback(() => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  const fetchLearningPaths = useCallback(async (force = false) => {
    if (!projectId) return;

    if (!force && isCacheValid() && learningPaths.length > 0) {
      return learningPaths;
    }

    setLoadingState('learningPaths', true);
    try {
      const response = await api.getProjectLearningPaths?.(projectId);
      const data = response?.data || [];
      setLearningPaths(data);
      setLastFetch(Date.now());
      return data;
    } catch (err) {
      // Gracefully ignore 404 if learning paths not available yet
      if (err.response?.status !== 404) {
        handleApiError(err, 'learning paths');
      }
      return [];
    } finally {
      setLoadingState('learningPaths', false);
    }
  }, [projectId, isCacheValid, learningPaths, setLoadingState, handleApiError]);

  return {
    learningPaths,
    fetchLearningPaths,
    isCacheValid,
    lastFetch
  };
}
