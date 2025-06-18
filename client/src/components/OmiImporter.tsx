import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

interface ConversationSummary {
  id: string;
  title: string;
  date: string;
  participants: Array<{id: string, name: string}>;
  duration_seconds: number;
}

interface FilePreview {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  conversations: ConversationSummary[];
  totalConversations: number;
}

interface FileUploadStatus {
  isUploading: boolean;
  success: boolean;
  error: string | null;
  message: string;
  stats: {
    total?: number;
    processed?: number;
  };
  progress: number; // 0-100
}

interface OmiImporterProps {
  onImportComplete?: (result: any) => void;
  className?: string;
}

const OmiImporter: React.FC<OmiImporterProps> = ({ onImportComplete, className = '' }) => {
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [fileUploadStatus, setFileUploadStatus] = useState<FileUploadStatus>({
    isUploading: false,
    success: false,
    error: null,
    message: 'Ready to upload',
    stats: {},
    progress: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Process the file upload
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      setFileUploadStatus({
        isUploading: false,
        success: false,
        error: `Invalid file type. Please upload a JSON file.`,
        message: 'Upload failed',
        stats: {},
        progress: 0
      });
      return;
    }

    try {
      // Start upload
      try {
        // Generate a preview of the file contents
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = JSON.parse(e.target?.result as string);
            const preview: FilePreview = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
              conversations: content.conversations?.slice(0, 5).map((conv: any) => ({
                id: conv.id,
                title: conv.title || 'Untitled Conversation',
                date: conv.date,
                participants: conv.participants || [],
                duration_seconds: conv.duration_seconds || 0
              })) || [],
              totalConversations: content.conversations?.length || 0
            };
            setFilePreview(preview);
          } catch (err) {
            console.error('Failed to parse JSON file', err);
          }
        };
        reader.readAsText(file);

        setFileUploadStatus({
          isUploading: true,
          success: false,
          error: null,
          message: 'Uploading...',
          stats: {},
          progress: 0
        });

        const formData = new FormData();
        formData.append('file', file);

        const config = {
          onUploadProgress: (progressEvent: any) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setFileUploadStatus(prev => ({
              ...prev,
              progress: percentCompleted
            }));
          }
        };

        axios.post('/api/omi/import/conversations', formData, config)
          .then((response) => {
            setFileUploadStatus({
              isUploading: false,
              success: true,
              error: null,
              message: response.data.message,
              stats: {
                total: response.data.total,
                processed: response.data.processed
              },
              progress: 100
            });

            // Notify parent
            if (onImportComplete) {
              onImportComplete(response.data);
            }
          })
          .catch((error: unknown) => {
            console.error('Error uploading file:', error);
            
            // Handle error
            let errorMessage = 'An unknown error occurred';
            if (axios.isAxiosError(error) && error.response) {
              errorMessage = error.response.data.error || error.response.data.message || errorMessage;
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            setFileUploadStatus({
              isUploading: false,
              success: false,
              error: `Upload failed: ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : error instanceof Error ? error.message : 'Unknown error'}`,
              message: 'Upload failed',
              stats: {},
              progress: 0
            });
          });
      } catch (error: unknown) {
        console.error('Error uploading file:', error);
        
        // Handle error
        let errorMessage = 'An unknown error occurred';
        if (axios.isAxiosError(error) && error.response) {
          errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        setFileUploadStatus({
          isUploading: false,
          success: false,
          error: `Upload failed: ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : error instanceof Error ? error.message : 'Unknown error'}`,
          message: 'Upload failed',
          stats: {},
          progress: 0
        });
      }
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      
      // Handle error
      let errorMessage = 'An unknown error occurred';
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setFileUploadStatus({
        isUploading: false,
        success: false,
        error: `Upload failed: ${axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : error instanceof Error ? error.message : 'Unknown error'}`,
        message: 'Upload failed',
        stats: {},
        progress: 0
      });
    }
  }, [onImportComplete]);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  const resetStatus = () => {
    setFilePreview(null);
    setFileUploadStatus({
      isUploading: false,
      success: false,
      error: null,
      message: 'Ready to upload',
      stats: {},
      progress: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`omi-importer ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`dropzone ${filePreview ? 'with-preview' : ''}`}
      >
        {!filePreview ? (
          <div className="dropzone-content">
            <p>Drag and drop your Omi conversations.json file here, or click to select</p>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept="application/json,.json"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="file-select-button"
            >
              Select File
            </button>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-info">
              <h3>{filePreview.name}</h3>
              <p>{(filePreview.size / 1024).toFixed(2)} KB • {filePreview.totalConversations} conversations</p>
            </div>
            
            {filePreview.conversations.length > 0 && (
              <div className="conversations-preview">
                <h4>Preview ({Math.min(5, filePreview.conversations.length)} of {filePreview.totalConversations})</h4>
                <ul className="conversation-list">
                  {filePreview.conversations.map(conv => (
                    <li key={conv.id} className="conversation-item">
                      <span className="conversation-title">{conv.title}</span>
                      <span className="conversation-date">{new Date(conv.date).toLocaleDateString()}</span>
                      <span className="conversation-duration">{Math.floor(conv.duration_seconds / 60)} min</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="preview-actions">
              <button 
                type="button" 
                className="upload-button" 
                onClick={() => processFile(fileInputRef.current?.files?.[0] as File)}
              >
                Upload {filePreview.totalConversations} Conversations
              </button>
              <button 
                type="button" 
                className="change-file-button" 
                onClick={resetStatus}
              >
                Change File
              </button>
            </div>
          </div>
        )}
      </div>

      {fileUploadStatus.isUploading && (
        <div className="upload-status uploading">
          <div className="spinner"></div>
          <p>{fileUploadStatus.message}</p>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${fileUploadStatus.progress}%` }}
            ></div>
          </div>
          <p className="progress-text">{fileUploadStatus.progress}% complete</p>
        </div>
      )}

      {fileUploadStatus.success && (
        <div className="upload-status success">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <p>{fileUploadStatus.message}</p>
          {fileUploadStatus.stats.processed !== undefined && fileUploadStatus.stats.total !== undefined && (
            <p className="stats">
              Processed {fileUploadStatus.stats.processed} of {fileUploadStatus.stats.total} conversations
            </p>
          )}
          <button 
            className="reset-button"
            onClick={resetStatus}
          >
            Import More
          </button>
        </div>
      )}

      {fileUploadStatus.error && (
        <div className="upload-status error">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <p>Upload failed</p>
          <p className="error-message">{fileUploadStatus.error}</p>
          <button 
            onClick={resetStatus}
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
        .progress-container {
          width: 100%;
          height: 8px;
          background-color: #e2e8f0;
          border-radius: 4px;
          margin: 10px 0;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background-color: #4f46e5;
          transition: width 0.3s ease;
        }
        .progress-text {
          margin: 5px 0 0;
          font-size: 14px;
          color: #4b5563;
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
        .file-preview {
          width: 100%;
          padding: 15px;
        }
        .file-info {
          margin-bottom: 15px;
        }
        .file-info h3 {
          margin: 0 0 5px;
          font-size: 16px;
          font-weight: 600;
        }
        .file-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        .conversations-preview {
          margin: 15px 0;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }
        .conversations-preview h4 {
          margin: 0 0 10px;
          font-size: 15px;
          font-weight: 500;
        }
        .conversation-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .conversation-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 4px;
          background-color: #f9fafb;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .conversation-title {
          font-weight: 500;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-right: 10px;
        }
        .conversation-date {
          color: #6b7280;
          margin-right: 10px;
        }
        .conversation-duration {
          color: #4b5563;
          font-weight: 500;
          width: 60px;
          text-align: right;
        }
        .preview-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
        }
        .upload-button {
          padding: 10px 20px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .upload-button:hover {
          background-color: #4338ca;
        }
        .change-file-button {
          padding: 10px 15px;
          background-color: transparent;
          color: #4b5563;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .change-file-button:hover {
          background-color: #f3f4f6;
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
