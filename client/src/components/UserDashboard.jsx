import React from 'react'

const UserDashboard = ({currentUser}) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold mb-6">Your Learning Journey</h2>

            <div className="space-y-4">
                <div className="text-center p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400 mb-1">🔥 {currentUser.streak}</div>
                    <div className="text-sm text-slate-400">Day Streak</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-green-400">⭐ {currentUser.level}</div>
                        <div className="text-xs text-slate-400">Skill Level</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                        <div className="text-lg font-semibold text-purple-400">🎯 3</div>
                        <div className="text-xs text-slate-400">Active Goals</div>
                    </div>
                </div>

                <div className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">Current Focus</div>
                    <div className="font-medium text-blue-400">{currentUser.currentFocus}</div>
                    <div className="mt-3 bg-slate-600 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">75% Complete</div>
                </div>
            </div>
        </div>
    )
}

export default UserDashboard
