import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useProjectData from '../hooks/useProjectData';
import useApiError from '../hooks/useApiError';
import useAnalyses from '../hooks/useAnalyses';
import useAnalyticsSummary from '../hooks/useAnalyticsSummary';
import useLearningPaths from '../hooks/useLearningPaths';
import useMockAnalysis from '../hooks/useMockAnalysis';
import useRefreshData from '../hooks/useRefreshData';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorDisplay from './common/ErrorDisplay';
import SummaryTab from './ProjectAnalysisUI/SummaryTab';
import AnalysisTab from './ProjectAnalysisUI/AnalysisTab';
import LearningPathsTab from './LearningPathsUI/LearningPathsTab';
import NavigationTabs from './ProjectAnalysisUI/NavigationTabs';
import { getStatusColor, getPriorityColor } from '../utils/functions';
import {  AlertTriangle, PlayCircle, RefreshCw} from 'lucide-react';

const ProjectAnalysis = ({ projectId: propProjectId, data, onDataUpdate }) => {
    const projectId = propProjectId;
    const [activeTab, setActiveTab] = useState('summary');

    const [loadingState, setLoadingState] = useState({ project: false, /* ... */ });
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const handleApiError = useApiError(setError);
    const {
    projectData,
    fetchProjectData,
    isCacheValid
    } = useProjectData(projectId, setLoadingState);

    const {
        analyses,
        fetchAnalyses
      } = useAnalyses(projectId, setLoadingState, onDataUpdate, isCacheValid);


    const {
    analyticsSummary,
    fetchAnalyticsSummary
    } = useAnalyticsSummary(projectId, setLoadingState, isCacheValid);
    
    const summary = analyticsSummary; // for backward compatibility

    const {
    learningPaths,
    fetchLearningPaths
    } = useLearningPaths(projectId, setLoadingState);


    const { runMockAnalysis } = useMockAnalysis({
    projectId,
    setLoadingState,
    fetchAnalyses,
    fetchAnalyticsSummary,
    setError
    });
    
    const { refreshing, refreshData } = useRefreshData({
    projectId,
    fetchProjectData,
    fetchAnalyses,
    fetchAnalyticsSummary,
    fetchLearningPaths,
    setError,
    setLastFetch
    });

    const computedStats = useMemo(() => {
        if (!analyticsSummary) return null;

        return {
            totalFiles: projectData?.totalFiles || 0,
            totalLanguages: projectData?.languages?.length || 0,
            totalAnalyses: analyticsSummary.totalAnalyses || 0,
            totalIssues: analyticsSummary.totalIssues || 0,
            averageScore: analyticsSummary.avgQualityScore || 0,
            criticalIssues: analyticsSummary.topIssueTypes?.filter(issue => issue.severity === 'HIGH')?.length || 0
        };
    }, [analyticsSummary, projectData]);

    // Enhanced toggle function
    const toggleExpanded = useCallback((id) => {
        setExpandedItems(prev => {
            const newExpanded = new Set(prev);
            if (newExpanded.has(id)) {
                newExpanded.delete(id);
            } else {
                newExpanded.add(id);
            }
            return newExpanded;
        });
    }, []);


    const loading =
        loadingState.project ||
        loadingState.analyses ||
        loadingState.summary ||
        loadingState.learningPaths;

    // Loading state
    if (loading) {
        return <LoadingSpinner text="Loading project analysis..." />;
    }

    // Error state
    if (error && !projectData) {
        return <ErrorDisplay error={error} onRetry={refreshData} />;
    }

    return (
        <div className="space-y-6">
            {/* Header with refresh button */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Project Analysis</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={refreshData}
                        disabled={refreshing}
                        className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <button
                        onClick={runMockAnalysis}
                        disabled={loadingState.mockAnalysis}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                        <PlayCircle className={`w-4 h-4 ${loadingState.mockAnalysis ? 'animate-spin' : ''}`} />
                        {loadingState.mockAnalysis ? 'Running...' : 'Run Analysis'}
                    </button>
                </div>
            </div>

            {/* Show any non-critical errors */}
            {error && projectData && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Some data may be incomplete: {error}</span>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <NavigationTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                loadingState={loadingState}
            />


            {/* Project Summary Tab */}
            {activeTab === 'summary' && (
                <SummaryTab
                    projectData={projectData}
                    analyticsSummary={analyticsSummary}
                    computedStats={computedStats}
                    getStatusColor={getStatusColor}
                />
            )}

            {/* Code Analysis Tab */}
            {activeTab === 'analysis' && (
                <AnalysisTab
                    analyses={analyses}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                    runMockAnalysis={runMockAnalysis}
                    loading={loadingState.analyses}
                />
            )}
                               

            {/* Learning Paths Tab */}
            {activeTab === 'learning' && (
                <LearningPathsTab
                    learningPaths={learningPaths}
                    loading={loadingState.learningPaths}
                    fetchLearningPaths={fetchLearningPaths}
                    getPriorityColor={getPriorityColor}
                />
            )}

            {/* Footer with last update info */}
            {lastFetch && (
                <div className="text-xs text-slate-500 text-center py-2">
                    Last updated: {new Date(lastFetch).toLocaleString()}
                </div>
            )}
        </div>
    );
};

export default ProjectAnalysis;
