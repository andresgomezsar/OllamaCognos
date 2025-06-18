import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';

interface FileUploadStatus {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  message: string;
  stats: {
    total?: number;
    processed?: number;
  };
}

interface OmiImporterProps {
  onImportComplete?: (result: any) => void;
  className?: string;
}

const OmiImporter: React.FC<OmiImporterProps> = ({ onImportComplete, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<FileUploadStatus>({
    isUploading: false,
    success: false,
    error: null,
    message: '',
    stats: {}
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  // Process the file upload
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatus({
        isUploading: false,
        success: false,
        error: 'Please upload a JSON file',
        message: 'Invalid file type',
        stats: {}
      });
      return;
    }

    try {
      // Start upload
      setStatus({
        isUploading: true,
        success: false,
        error: null,
        message: 'Uploading conversations...',
        stats: {}
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/omi/import/conversations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Handle success
      setStatus({
        isUploading: false,
        success: true,
        error: null,
        message: response.data.message || 'Import completed successfully',
        stats: {
          total: response.data.total,
          processed: response.data.processed
        }
      });

      // Notify parent
      if (onImportComplete) {
        onImportComplete(response.data);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Handle error
      let errorMessage = 'An unknown error occurred';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setStatus({
        isUploading: false,
        success: false,
        error: errorMessage,
        message: 'Import failed',
        stats: {}
      });
    }
  }, [onImportComplete]);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; // Just take the first file
      processFile(file);
    }
  }, [processFile]);

  // Handle manual file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  }, [processFile]);

  // Trigger file dialog
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Reset status
  const handleReset = () => {
    setStatus({
      isUploading: false,
      success: false,
      error: null,
      message: '',
      stats: {}
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`omi-importer ${className}`}>
      {!status.isUploading && !status.success && !status.error && (
        <div 
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <div className="dropzone-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="text-lg mt-2">Drag & drop your conversations.json file here</p>
            <p className="text-sm text-gray-500">or click to select</p>
            <input 
              ref={fileInputRef}
              type="file" 
              onChange={handleFileChange} 
              accept=".json"
              style={{ display: 'none' }} 
            />
          </div>
        </div>
      )}

      {status.isUploading && (
        <div className="upload-status uploading">
          <div className="spinner"></div>
          <p>Uploading and processing conversations...</p>
        </div>
      )}

      {status.success && (
        <div className="upload-status success">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Success!</h3>
          <p>{status.message}</p>
          {status.stats.processed !== undefined && (
            <p>Processed {status.stats.processed} of {status.stats.total || status.stats.processed} conversations</p>
          )}
          <button 
            onClick={handleReset}
            className="reset-button"
          >
            Import Another File
          </button>
        </div>
      )}

      {status.error && (
        <div className="upload-status error">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h3>Error</h3>
          <p>{status.error}</p>
          <button 
            onClick={handleReset}
            className="reset-button"
          >
            Try Again
          </button>
        </div>
      )}
      
      <style>{`
        .omi-importer {
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        .dropzone {
          border: 2px dashed #ccc;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: border 0.3s ease, background-color 0.3s ease;
        }
        .dropzone.active {
          border-color: #4f46e5;
          background-color: rgba(79, 70, 229, 0.05);
        }
        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #666;
        }
        .upload-status {
          text-align: center;
          padding: 30px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .upload-status.uploading {
          background-color: #f0f9ff;
          border: 1px solid #bae6fd;
        }
        .upload-status.success {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }
        .upload-status.error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
        }
        .spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid #4f46e5;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 0 auto 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .reset-button {
          margin-top: 15px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: #4f46e5;
          color: white;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .reset-button:hover {
          background-color: #4338ca;
        }
        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
};

export default OmiImporter;
