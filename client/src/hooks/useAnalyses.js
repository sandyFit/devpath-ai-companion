/**
 * This hook manages:
 * - Fetching code analyses
 * - Retry logic
 * - Parent update (onDataUpdate)
 * - No caching - always fetches fresh data
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const MAX_RETRIES = 3;

export default function useAnalyses(projectId, setLoadingState, onDataUpdate) {
  const [analyses, setAnalyses] = useState([]);
  const handleApiError = useApiError();

  const fetchAnalyses = useCallback(async (force = false, retryAttempt = 0) => {
    if (!projectId) return;

    setLoadingState('analyses', true);
    try {
      const response = await api.getProjectAnalysis(projectId);
      const data = response.data || [];
      setAnalyses(data);

      if (onDataUpdate) {
        onDataUpdate(data);
      }

      return data;
    } catch (err) {
      if (retryAttempt < MAX_RETRIES && err.response?.status >= 500) {
        console.warn(`Retrying analyses fetch (attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)));
        return fetchAnalyses(force, retryAttempt + 1);
      }

      handleApiError(err, 'analyses');
      throw err;
    } finally {
      setLoadingState('analyses', false);
    }
  }, [projectId, onDataUpdate, setLoadingState, handleApiError]);

  return {
    analyses,
    fetchAnalyses
  };
}
