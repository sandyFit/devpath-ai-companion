/**
 * This hook will:
 * - Trigger the backend mock analysis
 * - Update dependent data via fetchAnalyses() and fetchAnalyticsSummary()
 * - Handle loading and error states
 */

import { useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

export default function useMockAnalysis({
  projectId,
  setLoadingState,
  fetchAnalyses,
  fetchAnalyticsSummary,
  setError
}) {
  const handleApiError = useApiError(setError);

  const runMockAnalysis = useCallback(async () => {
    if (!projectId) return;

    setLoadingState('mockAnalysis', true);
    try {
      await api.mockGroqBatchAnalysis(projectId);

      // Refresh key data after mock analysis
      await Promise.all([
        fetchAnalyses(true),
        fetchAnalyticsSummary(true)
      ]);

      setError(null); // Clear previous errors
    } catch (err) {
      handleApiError(err, 'mock analysis');
      throw err;
    } finally {
      setLoadingState('mockAnalysis', false);
    }
  }, [projectId, fetchAnalyses, fetchAnalyticsSummary, setError, setLoadingState, handleApiError]);

  return { runMockAnalysis };
}
