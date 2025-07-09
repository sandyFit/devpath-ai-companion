import React, {useEffect} from 'react';
import { FileText, Code, CheckCircle, AlertTriangle, Layers } from 'lucide-react';
import ScoreBar from '../common/ScoreBar';

const SummaryTab = ({ projectData, analyticsSummary, computedStats, getStatusColor }) => {
    useEffect(() => {
        console.log('SummaryTab received props:', {
            projectData,
            analyticsSummary,
            computedStats
        });
    }, [projectData, analyticsSummary, computedStats]);

    return (
        <div className="space-y-6">
        {/* Project Overview */}
        <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <div className="flex items-start justify-between mb-4">
            <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                {projectData?.name || 'Project Analysis'}
                </h2>
                <p className="text-slate-400">
                {projectData?.description || 'Analyzing project structure and code quality'}
                </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(projectData?.status || 'PROCESSING')}`}>
                {projectData?.status || 'PROCESSING'}
            </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
                { icon: FileText, label: 'Total Files', value: computedStats?.totalFiles || 0, color: 'text-blue-400' },
                { icon: Code, label: 'Languages', value: computedStats?.totalLanguages || 0, color: 'text-purple-400' },
                { icon: CheckCircle, label: 'Analyses', value: computedStats?.totalAnalyses || 0, color: 'text-green-400' },
                { icon: AlertTriangle, label: 'Issues', value: computedStats?.totalIssues || 0, color: 'text-red-400' }
            ].map(({ icon: Icon, label, value, color }, i) => (
                <div key={i} className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-slate-400">{label}</span>
                </div>
                <div className="text-lg font-semibold text-white">{value}</div>
                </div>
            ))}
            </div>

            {/* Score Overview */}
            <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Overall Scores</h3>
            <ScoreBar score={analyticsSummary?.avgQualityScore || 0} label="Quality" color="bg-green-500" />
            <ScoreBar score={analyticsSummary?.avgComplexityScore || 0} label="Complexity" color="bg-yellow-500" />
            <ScoreBar score={analyticsSummary?.avgSecurityScore || 0} label="Security" color="bg-blue-500" />
            </div>
        </div>

        {/* Top Issues */}
        <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Top Issue Types
            </h3>
            <div className="space-y-3">
            {analyticsSummary?.topIssueTypes?.length ? (
                analyticsSummary.topIssueTypes.map((issue, index) => (
                <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{issue.type}</span>
                    <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                        className="h-full bg-red-500"
                        style={{ width: `${(issue.count / (analyticsSummary.totalIssues || 1)) * 100}%` }}
                        />
                    </div>
                    <span className="text-slate-400 text-sm w-8 text-right">{issue.count}</span>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-slate-400 text-sm">No issues found</div>
            )}
            </div>
        </div>

        {/* Language Breakdown */}
        <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Language Breakdown
            </h3>
            <div className="space-y-4">
            {analyticsSummary?.languageBreakdown?.length ? (
                analyticsSummary.languageBreakdown.map((lang, index) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{lang.language}</span>
                    <span className="text-slate-400 text-sm">{lang.files} files</span>
                    </div>
                    <ScoreBar score={lang.avgScore || 0} label="Avg Score" color="bg-purple-500" />
                </div>
                ))
            ) : (
                <div className="text-slate-400 text-sm">No language data available</div>
            )}
            </div>
        </div>
        </div>
    );
};

export default SummaryTab;
