import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const MAX_RETRIES = 3;

export default function useAnalyticsSummary(projectId, setLoadingState) {
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [error, setError] = useState(null);
  const handleApiError = useApiError();

  const fetchAnalyticsSummary = useCallback(async (force = false, retryAttempt = 0) => {
    if (!projectId) return;

    console.log('Fetching analytics summary for project:', projectId);
    setLoadingState('summary', true);
    setError(null);

    try {
      const response = await api.getProjectAnalyticsSummary(projectId);
      console.log('Analytics summary response:', response);

      const data = response.data || response || {};

      // If no data, create a fallback structure
      if (!data || Object.keys(data).length === 0) {
        console.warn('No analytics summary data received, using fallback');
        const fallbackData = {
          totalAnalyses: 0,
          totalIssues: 0,
          avgQualityScore: 0,
          avgComplexityScore: 0,
          avgSecurityScore: 0,
          languageBreakdown: [],
          topIssueTypes: []
        };
        setAnalyticsSummary(fallbackData);
        return fallbackData;
      }

      setAnalyticsSummary(data);
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
        avgComplexityScore: 0,
        avgSecurityScore: 0,
        languageBreakdown: [],
        topIssueTypes: [],
        error: true
      };
      setAnalyticsSummary(fallbackData);

      handleApiError(err, 'analytics summary');
      return fallbackData;
    } finally {
      setLoadingState('summary', false);
    }
  }, [projectId, setLoadingState, handleApiError]);

  return {
    analyticsSummary,
    fetchAnalyticsSummary,
    error
  };
}
