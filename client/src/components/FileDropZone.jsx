import React from 'react';
import { Upload } from 'lucide-react';

const FileDropzone = ({ onFileSelect, onDrop }) => {
    const handleDragOver = (e) => {
        e.preventDefault();
    };

    return (
        <div
            className="border-2 border-dashed border-purple-300 rounded-lg py-8 text-center 
        hover:border-purple-400 transition-colors cursor-pointer bg-white/10 
        backdrop-blur-sm"
            onDragOver={handleDragOver}
            onDrop={onDrop}
        >
            <Upload className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <p className="text-purple-200 mb-4">
                Drag & drop your ZIP file here or click to browse
            </p>

            <input
                type="file"
                accept=".zip"
                onChange={onFileSelect}
                className="hidden"
                id="file-upload"
            />

            <label
                htmlFor="file-upload"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-medium 
                    py-3 px-6 rounded-lg cursor-pointer transition-colors"
            >
                Select ZIP File
            </label>
        </div>
    );
};

export default FileDropzone;

