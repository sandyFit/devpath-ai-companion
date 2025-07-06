import React from 'react';
import { Clock } from 'lucide-react';

const LearningPathCard = ({ learningPath }) => {
    if (!learningPath) return null;

    const { estimated_hours, difficulty_level, recommended_topics } = learningPath;

    const getDifficultyStyle = (level) => {
        switch (level) {
            case 'beginner':
                return 'bg-green-500/20 text-green-300';
            case 'intermediate':
                return 'bg-yellow-500/20 text-yellow-300';
            case 'advanced':
                return 'bg-red-500/20 text-red-300';
            default:
                return 'bg-slate-500/20 text-slate-300';
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Your Learning Path</h3>
                <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-300" />
                    <span className="text-purple-200">{estimated_hours} hours</span>
                </div>
            </div>

            <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded text-sm ${getDifficultyStyle(difficulty_level)}`}>
                    {difficulty_level.charAt(0).toUpperCase() + difficulty_level.slice(1)}
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {recommended_topics.map((topic, index) => (
                    <div key={index} className="bg-purple-600/20 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">{topic}</h4>
                        <div className="text-sm text-purple-200">
                            Recommended based on your code analysis
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LearningPathCard;
