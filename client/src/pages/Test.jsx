import { useState, useCallback } from 'react';
import {
    Code,
    Github,
    Upload,
    Star,
    TrendingUp,
    FileText,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';

const FileUploadDebugger = () => {
    const [uploadStatus, setUploadStatus] = useState('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [debugLogs, setDebugLogs] = useState([]);
    const [uploadedFile, setUploadedFile] = useState(null);

    const addDebugLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugLogs(prev => [...prev, { timestamp, message, type }]);
    };

    // Simulate your API call with better error handling
    const simulateUpload = async (file) => {
        addDebugLog('Starting upload simulation...', 'info');
        
        try {
            // Simulate network delay
            for (let i = 0; i <= 100; i += 10) {
                setUploadProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Simulate random success/failure
            const success = Math.random() > 0.3; // 70% success rate
            
            if (success) {
                addDebugLog('Upload completed successfully!', 'success');
                setUploadStatus('completed');
                return { projectId: 'proj_' + Math.random().toString(36).substr(2, 9) };
            } else {
                throw new Error('Simulated network error');
            }
        } catch (error) {
            addDebugLog(`Upload failed: ${error.message}`, 'error');
            setUploadStatus('error');
            setErrorMessage(error.message);
            throw error;
        }
    };

    const handleFileUpload = useCallback(async (file) => {
        if (!file) {
            addDebugLog('No file provided', 'error');
            return;
        }

        addDebugLog(`File selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'info');

        // Validate file type - ZIP files can have multiple MIME types
        const validZipTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-zip',
            'application/octet-stream' // Sometimes ZIP files are detected as this
        ];
        
        const isValidZip = validZipTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip');
        
        if (!isValidZip) {
            const message = `Invalid file type: ${file.type}. Only ZIP files are allowed.`;
            setErrorMessage(message);
            setUploadStatus('error');
            addDebugLog(message, 'error');
            return;
        }

        // Validate file size (50MB limit)
        const MAX_FILE_SIZE = 50 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            const message = `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit.`;
            setErrorMessage(message);
            setUploadStatus('error');
            addDebugLog(message, 'error');
            return;
        }

        setErrorMessage('');
        setUploadedFile(file);
        setUploadStatus('uploading');
        setUploadProgress(0);
        addDebugLog('File validation passed, starting upload...', 'success');

        try {
            const userId = 'user-' + Math.random().toString(36).substr(2, 9);
            addDebugLog(`Generated user ID: ${userId}`, 'info');

            // In your real code, this would be:
            // const response = await api.uploadProject(file, userId, {
            //     onUploadProgress: (progressEvent) => {
            //         const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            //         setUploadProgress(percentCompleted);
            //     }
            // });

            const response = await simulateUpload(file);
            addDebugLog(`Upload response received: ${JSON.stringify(response)}`, 'success');

        } catch (error) {
            addDebugLog(`Upload error: ${error.message}`, 'error');
            setErrorMessage('Upload failed. Please try again.');
            setUploadStatus('error');
        }
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            addDebugLog('File selected via input', 'info');
            handleFileUpload(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            addDebugLog('File dropped', 'info');
            handleFileUpload(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const resetUpload = () => {
        setUploadedFile(null);
        setUploadStatus('idle');
        setUploadProgress(0);
        setErrorMessage('');
        setDebugLogs([]);
        addDebugLog('Upload reset', 'info');
    };

    const getStatusIcon = () => {
        switch (uploadStatus) {
            case 'uploading':
                return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-400" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Upload className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        switch (uploadStatus) {
            case 'uploading':
                return 'border-blue-400 bg-blue-50';
            case 'completed':
                return 'border-green-400 bg-green-50';
            case 'error':
                return 'border-red-400 bg-red-50';
            default:
                return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white min-h-screen">
            <div className="flex items-center gap-3 mb-8">
                <Code className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">File Upload Debugger</h2>
            </div>

            {uploadStatus === 'idle' && (
                <div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg mb-2">Drop your ZIP file here or click to browse</p>
                    <p className="text-gray-400 text-sm">Maximum file size: 50MB</p>
                    <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-input"
                    />
                    <label
                        htmlFor="file-input"
                        className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors"
                    >
                        Select File
                    </label>
                </div>
            )}

            {uploadStatus !== 'idle' && (
                <div className={`border-2 rounded-lg p-6 mb-6 ${getStatusColor()}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            {getStatusIcon()}
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    {uploadedFile?.name || 'Unknown file'}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {uploadedFile ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={resetUpload}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-sm"
                        >
                            Reset
                        </button>
                    </div>

                    {uploadStatus === 'uploading' && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errorMessage}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Debug Console */}
            <div className="mt-8 bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Debug Console
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {debugLogs.map((log, index) => (
                        <div key={index} className="flex items-start gap-3 text-sm">
                            <span className="text-gray-400 font-mono text-xs">
                                {log.timestamp}
                            </span>
                            <span className={`font-mono ${
                                log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                'text-gray-300'
                            }`}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    {debugLogs.length === 0 && (
                        <p className="text-gray-400 text-sm">No debug logs yet. Upload a file to see logs.</p>
                    )}
                </div>
            </div>

            {/* Common Issues Section */}
            <div className="mt-8 bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Common Upload Issues & Solutions</h3>
                <div className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-medium text-blue-400 mb-2">1. Backend Server Issues</h4>
                        <ul className="space-y-1 text-gray-300 ml-4">
                            <li>• Check if your backend server is running on http://localhost:3800</li>
                            <li>• Verify the /upload endpoint exists and accepts POST requests</li>
                            <li>• Check server logs for error messages</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-blue-400 mb-2">2. CORS Issues</h4>
                        <ul className="space-y-1 text-gray-300 ml-4">
                            <li>• Frontend (port 3000) to Backend (port 3800) may need CORS configuration</li>
                            <li>• Add CORS middleware to your backend server</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-blue-400 mb-2">3. File Upload Configuration</h4>
                        <ul className="space-y-1 text-gray-300 ml-4">
                            <li>• Ensure your backend accepts multipart/form-data</li>
                            <li>• Check file size limits on both client and server</li>
                            <li>• Verify the 'file' field name matches your backend expectations</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUploadDebugger;