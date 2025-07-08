/**
 * This hook manages:
 * - Fetching code analyses
 * - Retry logic
 * - Internal cache validation
 * - Parent update (onDataUpdate)
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const MAX_RETRIES = 3;
const CACHE_DURATION = 5 * 60 * 1000;

export default function useAnalyses(projectId, setLoadingState, onDataUpdate, isGlobalCacheValid) {
  const [analyses, setAnalyses] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);
  const handleApiError = useApiError();

  const isCacheValid = useCallback(() => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  const fetchAnalyses = useCallback(async (force = false, retryAttempt = 0) => {
    if (!projectId) return;

    if (!force && (isCacheValid() || isGlobalCacheValid?.()) && analyses.length > 0) {
      return analyses;
    }

    setLoadingState('analyses', true);
    try {
      const response = await api.getProjectAnalysis(projectId);
      const data = response.data || [];
      setAnalyses(data);
      setLastFetch(Date.now());

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
  }, [projectId, analyses, isCacheValid, isGlobalCacheValid, onDataUpdate, setLoadingState, handleApiError]);

  return {
    analyses,
    fetchAnalyses,
    isCacheValid,
    lastFetch
  };
}
