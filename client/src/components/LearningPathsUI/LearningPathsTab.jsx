import React from 'react';
import { BookOpen, Clock, Target, PlayCircle } from 'lucide-react';
import ProgressBar from '../common/ProgressBar';
import LoadingSpinner from '../common/LoadingSpinner';

const LearningPathsTab = ({ learningPaths, loading, fetchLearningPaths, getPriorityColor }) => {
    const handleRegenerate = () => {
        fetchLearningPaths(true);
    };

    if (loading) {
        return <LoadingSpinner text="Loading learning paths..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    Personalized Learning Paths
                </h3>
                <button
                    onClick={handleRegenerate}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    {loading ? 'Generating...' : 'Generate New Path'}
                </button>
            </div>

            {learningPaths.length === 0 ? (
                <div className="bg-slate-700/50 rounded-xl border border-slate-600 p-8 text-center">
                    <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Learning Paths Available</h3>
                    <p className="text-slate-400 mb-4">
                        Generate personalized learning paths based on your project analysis.
                    </p>
                    <button
                        onClick={handleRegenerate}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Generate Learning Path'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {learningPaths.map((path) => (
                        <div key={path.id} className="bg-slate-700/50 rounded-xl border border-slate-600 overflow-hidden">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="text-lg font-semibold text-white">{path.title}</h4>
                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(path.priority)}`}>
                                                {path.priority}
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-sm mb-3">{path.description}</p>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{path.estimatedHours}h estimated</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Target className="w-4 h-4" />
                                                <span>{path.topics?.length || 0} topics</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-400">{path.progress || 0}%</span>
                                            <ProgressBar progress={path.progress || 0} className="w-16" />
                                        </div>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1">
                                            <PlayCircle className="w-4 h-4" />
                                            Start
                                        </button>
                                    </div>
                                </div>

                                {/* Topics */}
                                {path.topics?.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="font-medium text-white mb-2">Learning Topics</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {path.topics.map((topic, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-slate-600/50 text-slate-300 rounded text-xs"
                                                >
                                                    {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Resources */}
                                {path.resources?.length > 0 && (
                                    <div>
                                        <h5 className="font-medium text-white mb-2">Recommended Resources</h5>
                                        <div className="space-y-2">
                                            {path.resources.map((res, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <span className="text-slate-400 capitalize">{res.type}:</span>
                                                    <a
                                                        href={res.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        {res.title}
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LearningPathsTab;
