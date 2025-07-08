import React from 'react';

const UploadStatusCard = ({ fileName, status, onReset, projectId }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'uploading':
                return 'bg-blue-500 animate-pulse';
            case 'processing':
                return 'bg-purple-500 animate-pulse';
            case 'completed':
                return 'bg-green-500';
            case 'error':
                return 'bg-red-500';
            default:
                return 'bg-gray-400';
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                    <span className="text-white font-medium">
                        {fileName || "No file selected"}
                    </span>
                </div>
                <button
                    onClick={onReset}
                    className="text-purple-300 hover:text-white transition-colors"
                >
                    Upload New File
                </button>
            </div>

            <div className="space-y-2 text-purple-200 text-sm">
                <div>🟣 Status: {status}</div>
                {projectId && <div>📁 Project ID: {projectId}</div>}
            </div>
        </div>
    );
};

export default UploadStatusCard;
