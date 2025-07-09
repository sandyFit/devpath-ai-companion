import React, { useState } from 'react';
import { Code, Brain } from 'lucide-react';

import Header from '../layouts/Header';
import UserDashboard from '../components/UserDashboard';
import CodeUpload from '../components/CodeUpload';
import AgentStatusCard from '../components/AgentStatusCard';
import AnalysisSummary from '../components/AnalysisSummary';
import LearningPathCard from '../components/LearningPathsUI/LearningPathsTab';
import ProjectAnalysis from '../components/ProjectAnalysis';

const Dashboard = () => {
    const [agentActivity, setAgentActivity] = useState([]);
    const [codeAnalysis, setCodeAnalysis] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [learningPath, setLearningPath] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [currentProjectId, setCurrentProjectId] = useState('408e786e-3d7a-4db2-9a8f-1f471e2f2164'); // TEMP: Test with user's project ID

    // Fixed filtering logic for project insights
    const projectInsights = React.useMemo(() => {
        console.log('Raw analysisData:', analysisData); // Debug log

        if (!analysisData) return [];

        // Handle wrapped response format (success, message, data)
        let dataToProcess = analysisData;
        if (analysisData.data && typeof analysisData.data === 'object') {
            dataToProcess = analysisData.data;
            console.log('Unwrapped data:', dataToProcess);
        }

        // Handle batch analysis results structure
        if (dataToProcess.results && Array.isArray(dataToProcess.results)) {
            const insights = dataToProcess.results.filter(item =>
                item.qualityScore !== undefined ||
                item.overallScore !== undefined ||
                item.analysisId !== undefined
            );
            console.log('Filtered batch results:', insights);
            return insights;
        }

        // Handle database analyses from batch result
        if (dataToProcess.databaseAnalyses && Array.isArray(dataToProcess.databaseAnalyses)) {
            console.log('Database analyses:', dataToProcess.databaseAnalyses);
            return dataToProcess.databaseAnalyses;
        }

        // If dataToProcess is an array, filter for items with overallScore OR standard analysis structure
        if (Array.isArray(dataToProcess)) {
            const insights = dataToProcess.filter(item =>
                item.overallScore !== undefined || // Project-level analysis
                item.qualityScore !== undefined    // File-level analysis that can be displayed
            );
            console.log('Filtered project insights:', insights); // Debug log
            return insights;
        }

        // If dataToProcess is an object, check for ProjectAnalyses property
        if (dataToProcess.ProjectAnalyses) {
            console.log('Found ProjectAnalyses:', dataToProcess.ProjectAnalyses); // Debug log
            return dataToProcess.ProjectAnalyses;
        }

        // If dataToProcess is a single analysis object, wrap it in an array
        if (dataToProcess.qualityScore !== undefined || dataToProcess.overallScore !== undefined) {
            console.log('Single analysis object:', [dataToProcess]); // Debug log
            return [dataToProcess];
        }

        return [];
    }, [analysisData]);

    const fileInsights = React.useMemo(() => {
        if (!analysisData) return [];

        // Handle wrapped response format
        let dataToProcess = analysisData;
        if (analysisData.data && typeof analysisData.data === 'object') {
            dataToProcess = analysisData.data;
        }

        // Handle batch analysis results
        if (dataToProcess.results && Array.isArray(dataToProcess.results)) {
            return dataToProcess.results.filter(item =>
                item.filename || item.analysisId
            );
        }

        if (Array.isArray(dataToProcess)) {
            return dataToProcess.filter(item =>
                item.filename || item.analysisId
            );
        }

        return dataToProcess?.fileAnalyses || [];
    }, [analysisData]);

    const [currentUser] = useState({
        name: "Alex Developer",
        streak: 7,
        level: "Intermediate",
        currentFocus: "React Hooks & Performance"
    });

    const agentStatus = [
        [
            { name: "Learning Scheduler", status: "Active", task: "Planning your next React session", color: "blue" },
            { name: "Code Reviewer", status: "Working", task: "Analyzing performance patterns", color: "purple" },
            { name: "Progress Tracker", status: "Monitoring", task: "Tracking skill improvements", color: "green" },
            { name: "Tutorial Generator", status: "Ready", task: "Creating custom content", color: "orange" },
            { name: "Peer Matcher", status: "Searching", task: "Finding study partners", color: "pink" },
            { name: "Mentor Agent", status: "Status", task: "Ready to answer questions", color: "cyan" }
        ]
    ];

    // FIXED: Handle upload result and batch analysis completion
    const handleUploadResult = (result) => {
        console.log('🎯 Dashboard: Upload result received:', result);
        console.log('🎯 Dashboard: Result structure:', {
            hasData: !!result?.data,
            dataKeys: result?.data ? Object.keys(result.data) : [],
            hasResults: !!result?.data?.results,
            hasDbAnalyses: !!result?.data?.databaseAnalyses,
            projectId: result?.data?.projectId || result?.projectId,
            hasAnalysisResult: !!result?.analysisResult,
            type: result?.type
        });

        // Handle batch analysis completion (when called from handleBatchAnalysis)
        if (result?.analysisResult || result?.type === 'batch_analysis') {
            console.log('🎯 Processing batch analysis result:', result.analysisResult || result);
            const analysisResult = result.analysisResult || result;
            setAnalysisData(analysisResult);
            return;
        }

        // Handle upload completion
        if (result?.data || result?.type === 'upload') {
            // Store the upload result
            setCodeAnalysis(result);

            // Extract projectId from upload result
            const projectId = result.data?.projectId || result.projectId;
            if (projectId) {
                console.log('🎯 Setting projectId from upload result:', projectId);
                setCurrentProjectId(projectId);
            }

            // If this upload result also contains analysis data, set it
            if (result.data && (result.data.results || result.data.databaseAnalyses)) {
                console.log('🎯 Setting analysis data from upload result:', result.data);
                setAnalysisData(result.data);
            }
        }
    };

    // Handle data updates from ProjectAnalysis component
    const handleDataUpdate = (data) => {
        console.log('🎯 Dashboard: Project analysis data updated:', data);
        if (data) {
            setAnalysisData(data);
        }
    };

    // Handle analysis status updates from CodeUpload
    const handleAnalysisStatusUpdate = (status) => {
        console.log('🎯 Dashboard: Analysis status updated:', status);
        setIsAnalyzing(status);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
            text-white p-6">
            <div className="max-w-7xl mx-auto">
                <Header />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-2xl border 
                        border-slate-700/50 p-6">
                        <div className="space-y-4 max-h-[40rem] overflow-y-auto">
                            <CodeUpload
                                onResult={handleUploadResult}
                                setIsAnalyzing={handleAnalysisStatusUpdate}
                                setAnalysisData={setAnalysisData}
                            />
                        </div>
                    </div>
                    <UserDashboard currentUser={currentUser} />
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-400" />
                        AI Code Analysis
                    </h2>

                    {/* Spinner section */}
                    {isAnalyzing && (
                        <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm">AI is analyzing your code...</span>
                            </div>
                            <div className="space-y-2 text-xs text-slate-400">
                                <div>🧠 AI: Generating insights...</div>
                                <div>📊 Processing files and calculating metrics...</div>
                                <div>🔍 Identifying patterns and potential improvements...</div>
                            </div>
                        </div>
                    )}

                    {/* Debug information - remove in production */}
                    {/* {process.env.NODE_ENV === 'development' && (
                        <div className="bg-slate-700/30 rounded-lg p-3 mb-4 text-xs">
                            <div className="text-slate-400">Debug Info:</div>
                            <div className="text-slate-300">
                                analysisData type: {typeof analysisData}, isArray: {Array.isArray(analysisData).toString()}
                            </div>
                            <div className="text-slate-300">
                                analysisData keys: {analysisData ? Object.keys(analysisData).join(', ') : 'none'}
                            </div>
                            <div className="text-slate-300">
                                projectInsights length: {projectInsights.length}
                            </div>
                            <div className="text-slate-300">
                                fileInsights length: {fileInsights.length}
                            </div>
                            <div className="text-slate-300">
                                currentProjectId: {currentProjectId || 'null'}
                            </div>
                            <div className="text-slate-300">
                                isAnalyzing: {isAnalyzing.toString()}
                            </div>
                            {analysisData?.results && (
                                <div className="text-slate-300">
                                    batch results count: {analysisData.results.length}
                                </div>
                            )}
                            {analysisData?.data?.results && (
                                <div className="text-slate-300">
                                    wrapped batch results count: {analysisData.data.results.length}
                                </div>
                            )}
                        </div>
                    )} */}

                    {/* Project Analysis – full width */}
                    {currentProjectId && (
                        <div className="mb-6">
                            <ProjectAnalysis
                                projectId={currentProjectId}
                                onDataUpdate={handleDataUpdate}
                            />
                        </div>
                    )}

                    {/* Show legacy analysis data only when no ProjectAnalysis is active */}
                    {!currentProjectId && (projectInsights?.length > 0 || fileInsights?.length > 0) && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-400" />
                                Analysis Results ({projectInsights.length + fileInsights.length} items)
                            </h3>
                            <div className="space-y-4">
                                {projectInsights.map((insight, index) => (
                                    <div key={`project-${index}`} className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-300">
                                                {insight.filename || insight.analysisId || `Project Analysis ${index + 1}`}
                                            </span>
                                            {(insight.qualityScore !== undefined || insight.overallScore !== undefined) && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${(insight.qualityScore || insight.overallScore) >= 80
                                                    ? 'bg-green-500/20 text-green-400' :
                                                    (insight.qualityScore || insight.overallScore) >= 60
                                                        ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    Score: {insight.qualityScore || insight.overallScore}%
                                                </span>
                                            )}
                                        </div>
                                        {insight.summary && (
                                            <p className="text-slate-400 text-sm mb-2">{insight.summary}</p>
                                        )}
                                        {insight.description && (
                                            <p className="text-slate-400 text-sm mb-2">{insight.description}</p>
                                        )}
                                        {insight.issues && insight.issues.length > 0 && (
                                            <div className="text-xs text-slate-500">
                                                Issues: {insight.issues.length}
                                            </div>
                                        )}
                                        {insight.suggestions && insight.suggestions.length > 0 && (
                                            <div className="text-xs text-slate-500">
                                                Suggestions: {insight.suggestions.length}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {fileInsights.map((insight, index) => (
                                    <div key={`file-${index}`} className="bg-slate-700/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-300">
                                                📄 {insight.filename || insight.analysisId || `File Analysis ${index + 1}`}
                                            </span>
                                            {insight.qualityScore !== undefined && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${insight.qualityScore >= 80 ? 'bg-green-500/20 text-green-400' :
                                                    insight.qualityScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    Score: {insight.qualityScore}%
                                                </span>
                                            )}
                                        </div>
                                        {insight.summary && (
                                            <p className="text-slate-400 text-sm mb-2">{insight.summary}</p>
                                        )}
                                        {insight.issues && insight.issues.length > 0 && (
                                            <div className="text-xs text-slate-500">
                                                Issues: {insight.issues.length}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Legacy codeAnalysis fallback */}
                    {codeAnalysis && !projectInsights?.length && !currentProjectId && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-400" />
                                Legacy Analysis Results
                            </h3>
                            <AnalysisSummary data={codeAnalysis} />
                        </div>
                    )}

                    {/* Show message when no analysis data */}
                    {!isAnalyzing && !projectInsights?.length && !fileInsights?.length && !codeAnalysis && !currentProjectId && (
                        <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                            <div className="text-slate-400 mb-2">No analysis results yet</div>
                            <div className="text-slate-500 text-sm">
                                Upload a project and run analysis to see AI-powered code analysis results
                            </div>
                        </div>
                    )}
                </div>

                {learningPath && <LearningPathCard learningPath={learningPath} />}

                
            </div>
        </div>
    );
};

export default Dashboard;
