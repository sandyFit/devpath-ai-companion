import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const MAX_RETRIES = 3;
const CACHE_DURATION = 5 * 60 * 1000;

export default function useAnalyticsSummary(projectId, setLoadingState, isGlobalCacheValid) {
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [error, setError] = useState(null); // Add error state
  const handleApiError = useApiError();

  const isCacheValid = useCallback(() => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  const fetchAnalyticsSummary = useCallback(async (force = false, retryAttempt = 0) => {
    if (!projectId) return;

    if (!force && (isCacheValid() || isGlobalCacheValid?.()) && analyticsSummary) {
      return analyticsSummary;
    }

    console.log('Fetching analytics summary for project:', projectId); // Debug log
    setLoadingState('summary', true);
    setError(null);

    try {
      const response = await api.getProjectAnalyticsSummary(projectId);
      console.log('Analytics summary response:', response); // Debug log

      const data = response.data || response || {}; // Handle different response formats

      // If no data, create a fallback structure
      if (!data || Object.keys(data).length === 0) {
        console.warn('No analytics summary data received, using fallback');
        const fallbackData = {
          totalAnalyses: 0,
          totalIssues: 0,
          avgQualityScore: 0,
          topIssueTypes: []
        };
        setAnalyticsSummary(fallbackData);
        setLastFetch(Date.now());
        return fallbackData;
      }

      setAnalyticsSummary(data);
      setLastFetch(Date.now());
      return data;
    } catch (err) {
      console.error('Analytics summary fetch error:', err);
      setError(err);

      if (retryAttempt < MAX_RETRIES && err.response?.status >= 500) {
        console.warn(`Retrying summary fetch (attempt ${retryAttempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryAttempt + 1)));
        return fetchAnalyticsSummary(force, retryAttempt + 1);
      }

      // Create fallback data on error
      const fallbackData = {
        totalAnalyses: 0,
        totalIssues: 0,
        avgQualityScore: 0,
        topIssueTypes: [],
        error: true
      };
      setAnalyticsSummary(fallbackData);

      handleApiError(err, 'analytics summary');
      // Don't throw error, return fallback instead
      return fallbackData;
    } finally {
      setLoadingState('summary', false);
    }
  }, [projectId, analyticsSummary, isCacheValid, isGlobalCacheValid, setLoadingState, handleApiError]);

  return {
    analyticsSummary,
    fetchAnalyticsSummary,
    isCacheValid,
    lastFetch,
    error
  };
}
