import React from 'react'


const AgentStatusCard = ({ name, bgColor, textColor, borderColor, status, task }) => {
    return (
        <div>
            <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4`}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{name}</h3>
                    <div className={`px-2 py-1 rounded-full text-xs 
                        bg-${bgColor}-400/10 text-${textColor}-400 border border-${borderColor}-400/20`}>
                        {status}
                    </div>
                </div>
                <p className="text-sm text-slate-400 mb-3">{task}</p>
                <button className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors">
                    Chat with Agent
                </button>
            </div>
        </div>
    );
}

export default AgentStatusCard;


