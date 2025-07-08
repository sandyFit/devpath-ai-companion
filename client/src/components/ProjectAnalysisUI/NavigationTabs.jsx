import { BarChart3, Code, BookOpen } from "lucide-react";

const NavigationTabs = ({ activeTab, setActiveTab, loadingState }) => {
    return (
        <div className="border-b border-slate-600">
            <nav className="flex space-x-8">
                {[
                    { id: 'summary', label: 'Project Summary', icon: BarChart3 },
                    { id: 'analysis', label: 'Code Analysis', icon: Code },
                    { id: 'learning', label: 'Learning Paths', icon: BookOpen }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === id
                                ? 'border-blue-500 text-blue-400'
                                : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                        {loadingState?.[id] && (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default NavigationTabs;
