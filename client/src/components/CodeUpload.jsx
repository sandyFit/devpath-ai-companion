import { useState, useCallback } from 'react';
import {
    Code,
    Github,
    Upload,
    Star,
    TrendingUp,
    FileText,
    Clock,
    AlertCircle
} from 'lucide-react';
import FileDropzone from "./FileDropZone";
import UploadStatusCard from './UploadStatusCard';
import AnalysisSummary from './AnalysisSummary';
import api from '../services/api';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CodeUpload = ({ onResult, setIsAnalyzing }) => {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, completed, error
    const [projectId, setProjectId] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [learningPath, setLearningPath] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');

    const handleFileUpload = useCallback(async (file) => {
        if (!file) return;
    
        // Validate file type - ZIP files can have multiple MIME types
        const validZipTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/x-zip',
            'application/octet-stream' // Sometimes ZIP files are detected as this
        ];
        
        const isValidZip = validZipTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip');
        
        if (!isValidZip) {
            setErrorMessage(`Invalid file type: ${file.type}. Only ZIP files are allowed.`);
            setUploadStatus('error');
            return;
        }
    
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage('File size exceeds 50MB limit.');
            setUploadStatus('error');
            return;
        }
    
        setErrorMessage('');
        setUploadedFile(file);
        setUploadStatus('uploading');
        setUploadProgress(0);
    
        try {
            const userId = 'user-' + Math.random().toString(36).substr(2, 9);
    
            const response = await api.uploadProject(file, userId, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
    
            setProjectId(response.projectId);
            setUploadStatus('processing');
            pollForCompletion(response.projectId);
        } catch (error) {
            console.error('Upload error:', error);
            setErrorMessage('Upload failed. Please try again.');
            setUploadStatus('error');
        }
    }, []);

    const pollForCompletion = async (projectId) => {
        const pollInterval = setInterval(async () => {
            try {
                const project = await api.getProject(projectId);

                if (project.project.status === 'completed') {
                    clearInterval(pollInterval);
                    setUploadStatus('completed');
                    loadAnalysisData(projectId);
                } else if (project.project.status === 'failed') {
                    clearInterval(pollInterval);
                    setUploadStatus('error');
                    setErrorMessage('Project processing failed.');
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 3000);
    };

    const loadAnalysisData = async (projectId) => {
        try {
            const analysis = await api.getProjectAnalysis(projectId);
            setAnalysisData(analysis);
            // Assuming learningPath data is part of analysis or fetched separately
            if (onResult) onResult(analysis);
        } catch (error) {
            console.error('Error loading analysis data:', error);
            setErrorMessage('Failed to load analysis data.');
        }
    };

    const handleAnalyze = async () => {
        if (!code.trim()) return;
        if (setIsAnalyzing) setIsAnalyzing(true);

        await new Promise(res => setTimeout(res, 1500));

        const fakeResult = {
            language,
            complexity: 'Intermediate',
            issues: "",
            suggestions: "",
            skillGaps: "",
            nextLearningPath: "React Performance Masterclass"
        };

        if (onResult) onResult(fakeResult);
        if (setIsAnalyzing) setIsAnalyzing(false);
    };

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    const resetUpload = () => {
        setUploadedFile(null);
        setUploadStatus('idle');
        setProjectId(null);
        setAnalysisData(null);
        setLearningPath(null);
        setUploadProgress(0);
        setErrorMessage('');
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <Code className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-semibold">Upload Your Project</h2>
            </div>

            {uploadStatus === 'idle' && (
                <FileDropzone onFileSelect={handleFileSelect} onDrop={handleDrop} />
            )}

            {uploadStatus !== 'idle' && (
                <div className="max-w-4xl mx-auto mb-8">
                    <UploadStatusCard
                        fileName={uploadedFile?.name}
                        status={uploadStatus}
                        onReset={resetUpload}
                        projectId={projectId}
                        progress={uploadProgress}
                        errorMessage={errorMessage}
                    />
                </div>
            )}

            <div className="mt-10 flex gap-3">
                <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <Upload className="w-4 h-4" />
                    Analyze Code
                </button>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                    <Github className="w-4 h-4" />
                    Connect GitHub
                </button>
            </div>
        </div>
    );
};

export default CodeUpload;
