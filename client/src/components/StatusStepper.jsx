import React from 'react';

const steps = [
    { label: 'File Upload', key: 'uploading' },
    { label: 'AI Analysis', key: 'processing' },
    { label: 'Learning Path Generation', key: 'completed' },
];

const StatusStepper = ({ currentStatus }) => {
    const getDotColor = (stepKey) => {
        if (currentStatus === stepKey) return 'bg-purple-500 animate-pulse';
        if (stepKey === 'completed' && currentStatus === 'completed') return 'bg-green-500';
        if (stepKey === 'processing' && (currentStatus === 'processing' || currentStatus === 'completed')) return 'bg-green-500';
        if (stepKey === 'uploading' && ['uploading', 'processing', 'completed'].includes(currentStatus)) return 'bg-green-500';
        return 'bg-gray-400';
    };

    return (
        <div className="space-y-2">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getDotColor(step.key)}`} />
                    <span className="text-purple-200 text-sm">{step.label}</span>
                </div>
            ))}
        </div>
    );
};

export default StatusStepper;
