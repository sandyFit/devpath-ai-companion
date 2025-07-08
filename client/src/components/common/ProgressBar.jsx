import React from 'react'

const ProgressBar = () => {
    return (
        <div className={`h-2 bg-slate-600 rounded-full overflow-hidden ${className}`}>
            <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(progress || 0, 100)}%` }}
            />
        </div>
    )
}

export default ProgressBar;

