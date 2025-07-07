import React, { useState } from 'react';
import {
    Code, Clock, CheckCircle, Brain, TrendingUp,
    MessageSquare, AlertCircle, Activity, Users, Zap
} from 'lucide-react';

import Header from '../layouts/Header';
import UserDashboard from '../components/UserDashboard';
import CodeUpload from '../components/CodeUpload';
import AgentStatusCard from '../components/AgentStatusCard';
import AnalysisSummary from '../components/AnalysisSummary';
import LearningPathCard from '../components/LearningPathCard';
import FileAnalysisList from '../components/FileAnalysisList';
import ProjectAnalysis from '../components/ProjectAnalysis';

const Dashboard = () => {
    const [agentActivity, setAgentActivity] = useState([]);
    const [codeAnalysis, setCodeAnalysis] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [learningPath, setLearningPath] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Fixed filtering logic for project insights
    const projectInsights = React.useMemo(() => {
        console.log('Raw analysisData:', analysisData); // Debug log
        
        if (!analysisData) return [];
        
        // If analysisData is an array, filter for items with overallScore OR standard analysis structure
        if (Array.isArray(analysisData)) {
            const insights = analysisData.filter(item => 
                item.overallScore !== undefined || // Project-level analysis
                item.qualityScore !== undefined    // File-level analysis that can be displayed
            );
            console.log('Filtered project insights:', insights); // Debug log
            return insights;
        }
        
        // If analysisData is an object, check for ProjectAnalyses property
        if (analysisData.ProjectAnalyses) {
            console.log('Found ProjectAnalyses:', analysisData.ProjectAnalyses); // Debug log
            return analysisData.ProjectAnalyses;
        }
        
        // If analysisData is a single analysis object, wrap it in an array
        if (analysisData.qualityScore !== undefined || analysisData.overallScore !== undefined) {
            console.log('Single analysis object:', [analysisData]); // Debug log
            return [analysisData];
        }
        
        return [];
    }, [analysisData]);

    const fileInsights = React.useMemo(() => {
        if (!analysisData) return [];
        
        if (Array.isArray(analysisData)) {
            return analysisData.filter(item => 
                item.filename || item.analysisId
            );
        }
        
        return analysisData?.fileAnalyses || [];
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
            { name: "Mentor Agent", status: "Available", task: "Ready to answer questions", color: "cyan" }
        ]
    ];

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
                                onResult={setCodeAnalysis}
                                setIsAnalyzing={setIsAnalyzing}
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
                            </div>
                        </div>
                    )}

                    {/* Debug information - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-slate-700/30 rounded-lg p-3 mb-4 text-xs">
                            <div className="text-slate-400">Debug Info:</div>
                            <div className="text-slate-300">
                                analysisData type: {typeof analysisData}, isArray: {Array.isArray(analysisData).toString()}
                            </div>
                            <div className="text-slate-300">
                                projectInsights length: {projectInsights.length}
                            </div>
                            <div className="text-slate-300">
                                fileInsights length: {fileInsights.length}
                            </div>
                            <button 
                                onClick={() => setAnalysisData([
                                    {
                                        analysisId: 'test-1',
                                        qualityScore: 8,
                                        complexityScore: 7,
                                        securityScore: 9,
                                        issues: [
                                            { type: 'Unused import', description: 'The \'os\' module is imported but not used.' }
                                        ],
                                        strengths: ['Good documentation'],
                                        suggestions: ['Add input validation'],
                                        learningRecommendations: ['Learn error handling']
                                    },
                                    {
                                        analysisId: 'project-1',
                                        overallScore: 7,
                                        mainIssues: ['Poor modularity'],
                                        suggestions: ['Split components by concern'],
                                        recommendedTopics: ['React architecture']
                                    }
                                ])}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
                            >
                                Test Mock Data
                            </button>
                        </div>
                    )}

                    {/* Project Analysis – full width */}
                    {projectInsights?.length > 0 && (
                        <div className="mb-6">
                            
                            <ProjectAnalysis data={projectInsights} />
                        </div>
                    )}

                    {/* Legacy codeAnalysis fallback */}
                    {codeAnalysis && !projectInsights?.length && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-blue-400" />
                                Legacy Analysis Results
                            </h3>
                            <ProjectAnalysis data={[codeAnalysis]} />
                            <AnalysisSummary data={codeAnalysis} />
                        </div>
                    )}

                    {/* Show message when no analysis data */}
                    {!isAnalyzing && !projectInsights?.length && !codeAnalysis && (
                        <div className="bg-slate-700/30 rounded-lg p-6 text-center">
                            <div className="text-slate-400 mb-2">No analysis results yet</div>
                            <div className="text-slate-500 text-sm">
                                Upload a project to see AI-powered code analysis results
                            </div>
                        </div>
                    )}
                </div>

                {learningPath && <LearningPathCard learningPath={learningPath} />}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agentStatus[0].map((agent, index) => (
                        <AgentStatusCard
                            key={index}
                            name={agent.name}
                            status={agent.status}
                            task={agent.task}
                            bgColor={agent.color}
                            textColor={agent.color}
                            borderColor={agent.color}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;