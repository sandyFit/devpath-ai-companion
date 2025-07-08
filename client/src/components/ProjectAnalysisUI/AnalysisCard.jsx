import React from 'react';
import {
    ChevronDown, ChevronUp,
    FileText, FolderOpen,
    AlertTriangle, CheckCircle, Lightbulb, BookOpen
} from 'lucide-react';
import ScoreBar from '../common/ScoreBar';

const AnalysisCard = ({ analysis, index, type, isExpanded, toggleExpanded }) => {
    const hasDetails =
        analysis.issues?.length > 0 ||
        analysis.strengths?.length > 0 ||
        analysis.suggestions?.length > 0 ||
        analysis.learningRecommendations?.length > 0;

    const id = analysis.analysisId || `${type}-${index}`;

    return (
        <div className="bg-slate-700/50 rounded-xl border border-slate-600 overflow-hidden">
            <div
                className="p-4 cursor-pointer hover:bg-slate-700/70 transition-colors"
                onClick={() => hasDetails && toggleExpanded(id)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {type === 'project' ? (
                            <FolderOpen className="w-5 h-5 text-blue-400" />
                        ) : (
                            <FileText className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                {type === 'project' ? 'Project Analysis' : analysis.filename || `File Analysis ${index + 1}`}
                            </h3>
                            {analysis.filename && type !== 'project' && (
                                <p className="text-sm text-slate-400">{analysis.filename}</p>
                            )}
                        </div>
                    </div>
                    {hasDetails && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                                {isExpanded ? 'Hide details' : 'Show details'}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                    )}
                </div>

                {/* Score Summary */}
                <div className="mt-4 space-y-2">
                    {analysis.overallScore !== undefined && (
                        <ScoreBar score={analysis.overallScore} label="Overall" color="bg-blue-500" />
                    )}
                    {analysis.qualityScore !== undefined && (
                        <ScoreBar score={analysis.qualityScore} label="Quality" color="bg-green-500" />
                    )}
                    {analysis.complexityScore !== undefined && (
                        <ScoreBar score={analysis.complexityScore} label="Complexity" color="bg-yellow-500" />
                    )}
                    {analysis.securityScore !== undefined && (
                        <ScoreBar score={analysis.securityScore} label="Security" color="bg-red-500" />
                    )}
                </div>

                {/* Summary tags */}
                <div className="mt-3 flex gap-4 text-xs text-slate-400">
                    {analysis.issues?.length > 0 && (
                        <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {analysis.issues.length} issue{analysis.issues.length > 1 ? 's' : ''}
                        </span>
                    )}
                    {analysis.strengths?.length > 0 && (
                        <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {analysis.strengths.length} strength{analysis.strengths.length > 1 ? 's' : ''}
                        </span>
                    )}
                    {analysis.suggestions?.length > 0 && (
                        <span className="flex items-center gap-1">
                            <Lightbulb className="w-3 h-3" />
                            {analysis.suggestions.length} suggestion{analysis.suggestions.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Expanded Detail Section */}
            {isExpanded && (
                <div className="border-t border-slate-600 p-4 space-y-4">
                    {analysis.issues?.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Issues ({analysis.issues.length})
                            </h4>
                            <div className="space-y-2">
                                {analysis.issues.map((issue, i) => (
                                    <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                        <div className="font-medium text-red-300 text-sm">{issue.type}</div>
                                        <div className="text-red-200 text-sm mt-1">{issue.description}</div>
                                        {issue.line && (
                                            <div className="text-red-400 text-xs mt-1">Line {issue.line}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {analysis.strengths?.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Strengths ({analysis.strengths.length})
                            </h4>
                            <div className="space-y-1">
                                {analysis.strengths.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-green-300 text-sm">
                                        <span className="text-green-500 mt-1">•</span>
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {analysis.suggestions?.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                Suggestions ({analysis.suggestions.length})
                            </h4>
                            <div className="space-y-1">
                                {analysis.suggestions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 text-yellow-200 text-sm">
                                        <span className="text-yellow-500 mt-1">•</span>
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {analysis.learningRecommendations?.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Learning Recommendations ({analysis.learningRecommendations.length})
                            </h4>
                            <div className="space-y-1">
                                {analysis.learningRecommendations.map((rec, i) => (
                                    <div key={i} className="flex items-start gap-2 text-blue-300 text-sm">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span>{rec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalysisCard;
