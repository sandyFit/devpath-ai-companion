import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb, 
  BookOpen,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Target,
  PlayCircle,
  Clock,
  Award,
  GitBranch,
  Code,
  Shield,
  Layers
} from 'lucide-react';

const ProjectAnalysis = ({ projectId, data, onDataUpdate }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [activeTab, setActiveTab] = useState('summary');
  const [projectData, setProjectData] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock data for demonstration
  const mockProjectData = {
    projectId: 'proj-123',
    name: 'Advanced React Dashboard',
    description: 'A comprehensive dashboard built with React, featuring real-time analytics and user management',
    status: 'COMPLETED',
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T14:30:00Z',
    totalFiles: 24,
    languages: ['JavaScript', 'TypeScript', 'CSS', 'HTML']
  };

  const mockAnalyticsSummary = {
    totalAnalyses: 24,
    avgQualityScore: 8.2,
    avgComplexityScore: 6.8,
    avgSecurityScore: 9.1,
    totalIssues: 12,
    totalSuggestions: 28,
    topIssueTypes: [
      { type: 'Code Quality', count: 5 },
      { type: 'Performance', count: 4 },
      { type: 'Security', count: 3 }
    ],
    languageBreakdown: [
      { language: 'JavaScript', files: 15, avgScore: 8.1 },
      { language: 'TypeScript', files: 6, avgScore: 8.7 },
      { language: 'CSS', files: 3, avgScore: 7.5 }
    ]
  };

  const mockLearningPaths = [
    {
      id: 'path-1',
      title: 'React Performance Optimization',
      description: 'Learn advanced techniques to optimize React applications for better performance',
      priority: 'HIGH',
      estimatedHours: 12,
      progress: 30,
      topics: [
        'React.memo and useMemo',
        'Code splitting and lazy loading',
        'Bundle optimization',
        'Virtual DOM optimization'
      ],
      resources: [
        { type: 'article', title: 'React Performance Best Practices', url: '#' },
        { type: 'video', title: 'Advanced React Optimization', url: '#' },
        { type: 'course', title: 'React Performance Masterclass', url: '#' }
      ]
    },
    {
      id: 'path-2',
      title: 'TypeScript Advanced Patterns',
      description: 'Master advanced TypeScript patterns and type system features',
      priority: 'MEDIUM',
      estimatedHours: 8,
      progress: 0,
      topics: [
        'Generic constraints',
        'Conditional types',
        'Mapped types',
        'Utility types'
      ],
      resources: [
        { type: 'documentation', title: 'TypeScript Handbook', url: '#' },
        { type: 'tutorial', title: 'Advanced TypeScript Patterns', url: '#' }
      ]
    },
    {
      id: 'path-3',
      title: 'Security Best Practices',
      description: 'Implement security best practices in web applications',
      priority: 'HIGH',
      estimatedHours: 6,
      progress: 75,
      topics: [
        'Input validation',
        'XSS prevention',
        'CSRF protection',
        'Authentication patterns'
      ],
      resources: [
        { type: 'guide', title: 'Web Security Guide', url: '#' },
        { type: 'checklist', title: 'Security Checklist', url: '#' }
      ]
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000)); // simulate delay
        setProjectData(mockProjectData);
        setAnalyticsSummary(mockAnalyticsSummary);
        setLearningPaths(mockLearningPaths);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData(); // 🔥 always runs
  }, []);
  

    const toggleExpanded = (id) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
        newExpanded.delete(id);
        } else {
        newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    const getStatusColor = (status) => {
        switch (status) {
        case 'COMPLETED': return 'text-green-400 bg-green-400/10';
        case 'PROCESSING': return 'text-yellow-400 bg-yellow-400/10';
        case 'FAILED': return 'text-red-400 bg-red-400/10';
        default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
        case 'HIGH': return 'text-red-400 bg-red-400/10';
        case 'MEDIUM': return 'text-yellow-400 bg-yellow-400/10';
        case 'LOW': return 'text-green-400 bg-green-400/10';
        default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    const ScoreBar = ({ score, label, color, max = 10 }) => (
        <div className="flex items-center gap-2">
        <span className="text-xs font-medium w-20">{label}:</span>
        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
            <div 
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${(score / max) * 100}%` }}
            />
        </div>
        <span className="text-xs w-12 text-right">{score.toFixed(1)}/{max}</span>
        </div>
    );

    const ProgressBar = ({ progress, className = "" }) => (
        <div className={`h-2 bg-slate-600 rounded-full overflow-hidden ${className}`}>
        <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
        />
        </div>
    );

    if (loading) {
        return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-slate-400">Loading project analysis...</span>
        </div>
        );
    }

    if (error) {
        return (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Error loading project analysis: {error}</span>
            </div>
        </div>
        );
    }

    return (
        <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-600">
            <nav className="flex space-x-8">
            {[
                { id: 'summary', label: 'Project Summary', icon: BarChart3 },
                { id: 'analysis', label: 'Code Analysis', icon: Code },
                { id: 'learning', label: 'Learning Paths', icon: BookOpen }
            ].map(({ id, label, icon: Icon }) => (
                <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
                >
                <Icon className="w-4 h-4" />
                {label}
                </button>
            ))}
            </nav>
        </div>

        {/* Project Summary Tab */}
        {activeTab === 'summary' && (
            <div className="space-y-6">
            {/* Project Overview */}
            <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
                <div className="flex items-start justify-between mb-4">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-2">{projectData?.name}</h2>
                    <p className="text-slate-400">{projectData?.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(projectData?.status)}`}>
                    {projectData?.status}
                </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-400">Total Files</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{projectData?.totalFiles}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">Languages</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{projectData?.languages?.length}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-slate-400">Analyses</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{analyticsSummary?.totalAnalyses}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-slate-400">Issues</span>
                    </div>
                    <div className="text-lg font-semibold text-white">{analyticsSummary?.totalIssues}</div>
                </div>
                </div>

                {/* Score Overview */}
                <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-3">Overall Scores</h3>
                <ScoreBar score={analyticsSummary?.avgQualityScore} label="Quality" color="bg-green-500" />
                <ScoreBar score={analyticsSummary?.avgComplexityScore} label="Complexity" color="bg-yellow-500" />
                <ScoreBar score={analyticsSummary?.avgSecurityScore} label="Security" color="bg-blue-500" />
                </div>
            </div>

            {/* Top Issues */}
            <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Top Issue Types
                </h3>
                <div className="space-y-3">
                {analyticsSummary?.topIssueTypes?.map((issue, index) => (
                    <div key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{issue.type}</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-red-500"
                            style={{ width: `${(issue.count / analyticsSummary.totalIssues) * 100}%` }}
                        />
                        </div>
                        <span className="text-slate-400 text-sm w-8 text-right">{issue.count}</span>
                    </div>
                    </div>
                ))}
                </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Language Breakdown
                </h3>
                <div className="space-y-4">
                {analyticsSummary?.languageBreakdown?.map((lang, index) => (
                    <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{lang.language}</span>
                        <span className="text-slate-400 text-sm">{lang.files} files</span>
                    </div>
                    <ScoreBar score={lang.avgScore} label="Avg Score" color="bg-purple-500" />
                    </div>
                ))}
                </div>
            </div>
            </div>
        )}

        {/* Code Analysis Tab */}
        {activeTab === 'analysis' && data && (
            <div className="space-y-6">
            {/* Existing analysis code */}
            {(() => {
                const projectAnalyses = data.filter(item => item.overallScore !== undefined);
                const fileAnalyses = data.filter(item => item.qualityScore !== undefined && item.overallScore === undefined);

                const AnalysisCard = ({ analysis, index, type }) => {
                const isExpanded = expandedItems.has(analysis.analysisId || `${type}-${index}`);
                const hasDetails = (analysis.issues?.length > 0) || 
                                (analysis.strengths?.length > 0) || 
                                (analysis.suggestions?.length > 0) || 
                                (analysis.learningRecommendations?.length > 0);

                return (
                    <div className="bg-slate-700/50 rounded-xl border border-slate-600 overflow-hidden">
                    <div 
                        className="p-4 cursor-pointer hover:bg-slate-700/70 transition-colors"
                        onClick={() => hasDetails && toggleExpanded(analysis.analysisId || `${type}-${index}`)}
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
                                {type === 'project' ? 'Project Analysis' : `File Analysis ${index + 1}`}
                            </h3>
                            {analysis.filename && (
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

                        {/* Scores */}
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

                        {/* Quick summary */}
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

                    {/* Expanded details */}
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
                                {analysis.strengths.map((strength, i) => (
                                <div key={i} className="flex items-start gap-2 text-green-300 text-sm">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span>{strength}</span>
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
                                {analysis.suggestions.map((suggestion, i) => (
                                <div key={i} className="flex items-start gap-2 text-yellow-200 text-sm">
                                    <span className="text-yellow-500 mt-1">•</span>
                                    <span>{suggestion}</span>
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

                return (
                <>
                    {/* Project-level analyses */}
                    {projectAnalyses.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-400" />
                        Project Overview
                        </h3>
                        <div className="space-y-4">
                        {projectAnalyses.map((analysis, index) => (
                            <AnalysisCard 
                            key={analysis.analysisId || `project-${index}`}
                            analysis={analysis} 
                            index={index} 
                            type="project"
                            />
                        ))}
                        </div>
                    </div>
                    )}

                    {/* File-level analyses */}
                    {fileAnalyses.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        File Analyses ({fileAnalyses.length})
                        </h3>
                        <div className="space-y-4">
                        {fileAnalyses.map((analysis, index) => (
                            <AnalysisCard 
                            key={analysis.analysisId || `file-${index}`}
                            analysis={analysis} 
                            index={index} 
                            type="file"
                            />
                        ))}
                        </div>
                    </div>
                    )}
                </>
                );
            })()}
            </div>
        )}

        {/* Learning Paths Tab */}
        {activeTab === 'learning' && (
            <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Personalized Learning Paths
                </h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Generate New Path
                </button>
            </div>

            <div className="space-y-4">
                {learningPaths.map((path) => (
                <div key={path.id} className="bg-slate-700/50 rounded-xl border border-slate-600 overflow-hidden">
                    <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-white">{path.title}</h4>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(path.priority)}`}>
                            {path.priority}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{path.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{path.estimatedHours}h estimated</span>
                            </div>
                            <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{path.topics.length} topics</span>
                            </div>
                        </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">{path.progress}%</span>
                            <ProgressBar progress={path.progress} className="w-16" />
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1">
                            <PlayCircle className="w-4 h-4" />
                            Start
                        </button>
                        </div>
                    </div>

                    {/* Topics */}
                    <div className="mb-4">
                        <h5 className="font-medium text-white mb-2">Learning Topics</h5>
                        <div className="flex flex-wrap gap-2">
                        {path.topics.map((topic, index) => (
                            <span 
                            key={index}
                            className="px-2 py-1 bg-slate-600/50 text-slate-300 rounded text-xs"
                            >
                            {topic}
                            </span>
                        ))}
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        <h5 className="font-medium text-white mb-2">Recommended Resources</h5>
                        <div className="space-y-2">
                        {path.resources.map((resource, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-slate-400 capitalize">{resource.type}:</span>
                            <a href={resource.url} className="text-blue-400 hover:text-blue-300 transition-colors">
                                {resource.title}
                            </a>
                            </div>
                        ))}
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            </div>
        )}
        </div>
    );
};

export default ProjectAnalysis;