import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const MAX_RETRIES = 3;
const CACHE_DURATION = 5 * 60 * 1000;

export default function useAnalyticsSummary(projectId, setLoadingState, isGlobalCacheValid) {
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const handleApiError = useApiError();

  const isCacheValid = useCallback(() => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  const fetchAnalyticsSummary = useCallback(async (force = false, retryAttempt = 0) => {
    if (!projectId) return;

    if (!force && (isCacheValid() || isGlobalCacheValid?.()) && analyticsSummary) {
      return analyticsSummary;
    }

    setLoadingState('summary', true);
    try {
      const response = await api.getProjectAnalyticsSummary(projectId);
      const data = response.data || {};
      setAnalyticsSummary(data);
      setLastFetch(Date.now());
      return data;
    } catch (err) {
      if (retryAttempt < MAX_RETRIES && err.response?.status >= 500) {
        console.warn(`Retrying summary fetch (attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)));
        return fetchAnalyticsSummary(force, retryAttempt + 1);
      }

      handleApiError(err, 'analytics summary');
      throw err;
    } finally {
      setLoadingState('summary', false);
    }
  }, [projectId, analyticsSummary, isCacheValid, isGlobalCacheValid, setLoadingState, handleApiError]);

  return {
    analyticsSummary,
    fetchAnalyticsSummary,
    isCacheValid,
    lastFetch
  };
}
