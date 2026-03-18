import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload, FiFile, FiImage, FiVideo, FiMusic, FiX } from 'react-icons/fi';
import Button from './Button';
import { formatFileSize } from '../../utils/helpers';

const FileUpload = ({
  onUpload,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov'],
    'audio/*': ['.mp3', '.wav', '.ogg'],
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt']
  },
  className = '',
  disabled = false
}) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError(`File size exceeds ${formatFileSize(maxSize)} limit`);
      } else {
        setError('Invalid file type');
      }
      return;
    }

    const newFiles = multiple ? [...files, ...acceptedFiles] : [acceptedFiles[0]];
    setFiles(newFiles);
    
    if (onUpload) {
      onUpload(multiple ? newFiles : newFiles[0]);
    }
  }, [files, maxSize, multiple, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled
  });

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    if (onUpload) {
      onUpload(multiple ? newFiles : newFiles[0]);
    }
  };

  const clearAll = () => {
    setFiles([]);
    if (onUpload) {
      onUpload(null);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <FiImage className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <FiVideo className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <FiMusic className="w-5 h-5" />;
    return <FiFile className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500'}
        `}
      >
        <input {...getInputProps()} />
        
        <FiUpload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          or click to browse
        </p>
        
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Supports images, videos, audio, PDF, and text files
          <br />
          Max size: {formatFileSize(maxSize)}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Selected files */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">
              Selected Files ({files.length})
            </h4>
            {files.length > 1 && (
              <Button
                variant="ghost"
                size="small"
                onClick={clearAll}
                className="text-sm"
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500 dark:text-gray-400">
                    {getFileIcon(file)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Remove file"
                >
                  <FiX className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;