import React from 'react';
import { Code, FileText, FolderOpen } from 'lucide-react';
import AnalysisCard from './AnalysisCard';
import LoadingSpinner from '../common/LoadingSpinner';

const AnalysisTab = ({
    data,
    analyses,
    expandedItems,
    toggleExpanded,
    runMockAnalysis,
    loading
}) => {
    const analysisData = data || analyses;
    
    // All analyses have qualityScore, so we'll show them all as file analyses
    // Project-level analyses would have overallScore, but our current data structure has individual file analyses
    const projectAnalyses = analysisData?.filter(a => a.overallScore !== undefined) || [];
    const fileAnalyses = analysisData?.filter(a => a.qualityScore !== undefined) || [];

    if (loading) {
        return <LoadingSpinner text="Loading code analysis..." />;
    }

    if (!analysisData || analysisData.length === 0) {
        return (
            <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-8 text-center">
                <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Analysis Data</h3>
                <p className="text-slate-400 mb-4">Click "Run Analysis" to get started.</p>
                <button
                    onClick={runMockAnalysis}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Run Analysis
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {projectAnalyses.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-400" />
                        Project Overview
                    </h3>
                    <div className="space-y-4">
                        {projectAnalyses.map((a, i) => (
                            <AnalysisCard
                                key={a.analysisId || `project-${i}`}
                                analysis={a}
                                index={i}
                                type="project"
                                isExpanded={expandedItems.has(a.analysisId || `project-${i}`)}
                                toggleExpanded={toggleExpanded}
                            />
                        ))}
                    </div>
                </div>
            )}
            {fileAnalyses.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        File Analyses ({fileAnalyses.length})
                    </h3>
                    <div className="space-y-4">
                        {fileAnalyses.map((a, i) => (
                            <AnalysisCard
                                key={a.analysisId || `file-${i}`}
                                analysis={a}
                                index={i}
                                type="file"
                                isExpanded={expandedItems.has(a.analysisId || `file-${i}`)}
                                toggleExpanded={toggleExpanded}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisTab;
