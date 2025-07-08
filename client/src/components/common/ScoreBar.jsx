import React from 'react'

const ScoreBar = ({label, color, max, score}) => {
    return (       
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium w-20">{label}:</span>
            <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} transition-all duration-300`}
                    style={{ width: `${Math.min((score / max) * 100, 100)}%` }}
                />
            </div>
            <span className="text-xs w-12 text-right">{score?.toFixed(1) || '0.0'}/{max}</span>
        </div>
    );
    
}

export default ScoreBar
