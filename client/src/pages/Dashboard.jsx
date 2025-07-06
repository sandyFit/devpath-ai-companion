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

const Dashboard = () => {
    const [agentActivity, setAgentActivity] = useState([]);
    const [codeAnalysis, setCodeAnalysis] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [learningPath, setLearningPath] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
                            <CodeUpload onResult={setCodeAnalysis} setIsAnalyzing={setIsAnalyzing} />
                        </div>
                    </div>
                    <UserDashboard currentUser={currentUser} />
                </div>

                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-400" />
                        AI Code Analysis
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            {isAnalyzing && (
                                <div className="bg-slate-700/50 rounded-lg p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm">AI agents are analyzing your code...</span>
                                    </div>
                                    <div className="space-y-2 text-xs text-slate-400">
                                        <div>🔍 Blackbox.ai: Scanning for patterns...</div>
                                        <div>🧠 Llama: Generating insights...</div>
                                        <div>⚡ Groq: Processing recommendations...</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {analysisData?.fileAnalyses && (
                            <FileAnalysisList files={analysisData.fileAnalyses} />
                        )}


                        {codeAnalysis && (
                            <AnalysisSummary data={codeAnalysis} />
                        )}

                    </div>
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
