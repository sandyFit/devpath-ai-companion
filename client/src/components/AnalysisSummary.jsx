import React from 'react';

const AnalysisSummary = ({ data }) => {
    if (!data) return null;

    return (
        <div className="bg-slate-700/30 rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-green-400">Analysis Complete!</h3>
            <div className="space-y-3 text-sm">
                <div>
                    <span className="text-slate-400">Language:</span>
                    <span className="ml-2 text-blue-400">{data.language}</span>
                </div>
                <div>
                    <span className="text-slate-400">Complexity:</span>
                    <span className="ml-2 text-yellow-400">{data.complexity}</span>
                </div>
                <div>
                    <span className="text-slate-400">Issues Found:</span>
                    <span className="ml-2 text-red-400">{data.issues.length}</span>
                </div>
                <div>
                    <span className="text-slate-400">Next Learning Path:</span>
                    <span className="ml-2 text-purple-400">{data.nextLearningPath}</span>
                </div>
            </div>
        </div>
    );
};

export default AnalysisSummary;
