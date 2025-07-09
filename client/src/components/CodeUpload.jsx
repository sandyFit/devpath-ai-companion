import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, PlayCircle,  X, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';


const CodeUpload = ({ onResult, setIsAnalyzing, setAnalysisData }) => {
    const [projectId, setProjectId] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleBatchAnalysis = async () => {
        if (!projectId) {
            setUploadError('No project uploaded yet');
            return;
        }

        try {
            setIsAnalyzing(true);
            setUploadStatus('analyzing');
            setUploadError('');

            console.log('Starting batch analysis for project:', projectId);
            const result = await api.runBatchAnalysis(projectId);

            console.log('Batch analysis completed:', result);
            setUploadStatus('analyzed');

            if (onResult) {
                onResult({ projectId, analysisResult: result }); // trigger reload from parent
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            setUploadStatus('error');
            setUploadError(`Analysis failed: ${error.message || 'Please try again.'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };
    

    // Mock user ID - replace with actual user ID from your auth system
    const userId = 'user123'; // You should get this from your auth context

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileSelection(files[0]);
        }
    };

    const handleFileSelection = (file) => {
        // Reset previous state
        setUploadError('');
        setUploadStatus('idle');
        setUploadProgress(0);
        
        // Validate file exists
        if (!file) {
            setUploadError('No file selected');
            return;
        }

        // Check if file is empty
        if (file.size === 0) {
            setUploadError('Selected file is empty. Please choose a valid ZIP file with content.');
            return;
        }
        
        // Validate file type
        if (!file.type.includes('zip') && !file.name.endsWith('.zip')) {
            setUploadError('Please select a valid ZIP file');
            return;
        }

        // Check file size (50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setUploadError('File size exceeds 50MB limit');
            return;
        }

        setSelectedFile(file);
        console.log('File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadError('Please select a file first');
            return;
        }

        try {
            setUploadStatus('uploading');
            setUploadError('');
            setIsAnalyzing(true);

            console.log('Testing server connection...');
            await api.testConnection();
            console.log('Server connection successful');

            console.log('Starting upload...');
            const result = await api.uploadProject(selectedFile, userId);
            setProjectId(result.data?.projectId);

            console.log('Upload completed:', result);

            setUploadStatus('success');
            setUploadProgress(100);

            if (onResult) {
                onResult(result); // send result to parent so it can save projectId
            }

        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setUploadError(error.message || 'Upload failed. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    

    const resetUpload = () => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setUploadError('');
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };


    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Upload Your Code Project</h2>
                <p className="text-slate-400">Upload a ZIP file containing your code project for AI analysis</p>
            </div>

            {/* File Drop Zone */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                    dragActive 
                        ? 'border-blue-400 bg-blue-50/5' 
                        : 'border-slate-600 hover:border-slate-500'
                } ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-50' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => e.target.files[0] && handleFileSelection(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadStatus === 'uploading'}
                />
                
                <div className="space-y-4">
                    {uploadStatus === 'uploading' ? (
                        <Loader2 className="w-12 h-12 text-blue-400 mx-auto animate-spin" />
                    ) : (
                        <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    )}
                    
                    <div>
                        <p className="text-lg font-medium text-white">
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Drop your ZIP file here'}
                        </p>
                        <p className="text-sm text-slate-400">
                            or click to browse (max 50MB)
                        </p>
                    </div>
                </div>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="font-medium text-white">{selectedFile.name}</p>
                                <p className="text-sm text-slate-400">{formatFileSize(selectedFile.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={resetUpload}
                            className="p-1 hover:bg-slate-600 rounded"
                            disabled={uploadStatus === 'uploading'}
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            {uploadStatus === 'uploading' && (
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-slate-400 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {uploadError && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <p className="text-red-400">{uploadError}</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {uploadStatus === 'success' && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-green-400">Upload successful! AI analysis is starting...</p>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <div className="mt-6 flex justify-center gap-4">
                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploadStatus === 'uploading'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 
            disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200
            flex items-center space-x-2"
                >
                    {uploadStatus === 'uploading' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            <span>Upload</span>
                        </>
                    )}
                </button>

                {/* Analysis Button */}
                <button
                    onClick={handleBatchAnalysis}
                    disabled={!projectId || uploadStatus === 'analyzing'}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 
                        disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200
                        flex items-center space-x-2"
                >
                    {uploadStatus === 'analyzing' ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <PlayCircle className="w-4 h-4" />
                            <span>Run Analysis</span>
                        </>
                    )}
                </button>

            </div>


            {/* Debug Info (remove in production) */}
            {/* <div className="mt-4 p-3 bg-slate-800/50 rounded text-xs text-slate-400">
                <p>Debug: Server URL: http://localhost:3800</p>
                <p>Status: {uploadStatus}</p>
                {selectedFile && <p>File: {selectedFile.name}</p>}
            </div> */}
        </div>
    );
};

export default CodeUpload;
