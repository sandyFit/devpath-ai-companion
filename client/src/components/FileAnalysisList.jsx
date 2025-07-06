import React from 'react';
import { FileText } from 'lucide-react';

const FileAnalysisList = ({ files }) => {
    if (!files || files.length === 0) return null;

    const getQualityColor = (score) => {
        if (score >= 8) return 'text-green-400';
        if (score >= 5) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getComplexityColor = (score) => {
        if (score <= 4) return 'text-green-400';
        if (score <= 7) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">File Analysis Details</h3>

            <div className="space-y-4">
                {files.map((file, index) => (
                    <div
                        key={index}
                        className="border border-purple-300/30 rounded-lg p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-purple-300" />
                                <span className="text-white font-medium">{file.filename}</span>
                                <span className="text-sm text-purple-200 bg-purple-600/20 px-2 py-1 rounded">
                                    {file.language}
                                </span>
                            </div>

                            <div className="flex space-x-4">
                                <div className="text-center">
                                    <div className={`text-sm font-medium ${getQualityColor(file.qualityScore)}`}>
                                        {file.qualityScore}/10
                                    </div>
                                    <div className="text-xs text-purple-200">Quality</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-sm font-medium ${getComplexityColor(file.complexityScore)}`}>
                                        {file.complexityScore}/10
                                    </div>
                                    <div className="text-xs text-purple-200">Complexity</div>
                                </div>
                            </div>
                        </div>

                        {file.issues?.length > 0 && (
                            <div className="mb-3">
                                <h5 className="text-sm font-medium text-red-300 mb-2">Issues Found:</h5>
                                <ul className="text-sm text-purple-200 space-y-1">
                                    {file.issues.map((issue, idx) => (
                                        <li key={idx} className="flex items-start space-x-2">
                                            <span className="text-red-400 mt-1">•</span>
                                            <span>{issue}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {file.suggestions?.length > 0 && (
                            <div>
                                <h5 className="text-sm font-medium text-green-300 mb-2">Suggestions:</h5>
                                <ul className="text-sm text-purple-200 space-y-1">
                                    {file.suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start space-x-2">
                                            <span className="text-green-400 mt-1">•</span>
                                            <span>{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileAnalysisList;
