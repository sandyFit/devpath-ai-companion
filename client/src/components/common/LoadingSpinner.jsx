
const LoadingSpinner = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-slate-400">{text}</span>
    </div>
);
export default LoadingSpinner;
