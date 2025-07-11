/**
 * This hook manages:
 * - Fetching learning paths
 * - Force-refreshing/generating new paths
 * - Error and loading state
 * - No caching - always fetches fresh data
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

export default function useLearningPaths(projectId, setLoadingState) {
  const [learningPaths, setLearningPaths] = useState([]);
  const handleApiError = useApiError();

  const fetchLearningPaths = useCallback(async (force = false) => {
    if (!projectId) return;

    setLoadingState('learningPaths', true);
    try {
      const response = await api.getProjectLearningPaths?.(projectId);
      const data = response?.data || [];
      setLearningPaths(data);
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
  }, [projectId, setLoadingState, handleApiError]);

  return {
    learningPaths,
    fetchLearningPaths
  };
}
