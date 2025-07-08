
const ErrorDisplay = ({ error, onRetry }) => (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Error: {error}</span>
        </div>
        {onRetry && (
            <button
                onClick={onRetry}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm 
                    transition-colors"
            >
                Retry
            </button>
        )}
    </div>
);

export default ErrorDisplay;
