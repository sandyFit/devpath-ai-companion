/**
 * This hook manages:
 * - Fetching project data from API
 * - Caching logic
 * - Setting loading state
 * - Error handling
 */

import { useState, useCallback } from 'react';
import api from '../services/api';
import useApiError from './useApiError';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function useProjectData(projectId, setLoadingState) {
  const handleApiError = useApiError();
  const [projectData, setProjectData] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const isCacheValid = useCallback(() => {
    return lastFetch && (Date.now() - lastFetch) < CACHE_DURATION;
  }, [lastFetch]);

  const fetchProjectData = useCallback(async (force = false) => {
    if (!projectId) return;

    if (!force && isCacheValid() && projectData) {
      return projectData;
    }

    setLoadingState('project', true);
    try {
      const response = await api.getProject(projectId);
      const data = response.data;
      setProjectData(data);
      setLastFetch(Date.now());
      return data;
    } catch (err) {
      handleApiError(err, 'project data');
      throw err;
    } finally {
      setLoadingState('project', false);
    }
  }, [projectId, isCacheValid, projectData, handleApiError, setLoadingState]);

  return {
    projectData,
    fetchProjectData,
    isCacheValid,
    lastFetch
  };
}
