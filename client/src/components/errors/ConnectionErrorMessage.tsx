import React from 'react';
import { AlertCircle, HelpCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert.js';
import { Button } from '@/components/ui/button.js';

interface ConnectionErrorMessageProps {
  serviceName: string;
  url?: string;
  message?: string;
  onRetry?: () => void;
  onConfigure?: () => void;
}

export function ConnectionErrorMessage({ 
  serviceName, 
  url, 
  message, 
  onRetry, 
  onConfigure 
}: ConnectionErrorMessageProps) {
  // Determine if this is a local or remote connection
  const isLocalConnection = url?.includes('localhost') || url?.includes('127.0.0.1');
  
  // Get a more specific help message based on the error and connection type
  const getHelpMessage = () => {
    if (isLocalConnection) {
      return (
        <>
          <p className="mt-2">For local Ollama connections:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
            <li>Make sure Ollama is installed and running on your computer</li>
            <li>Check that the Ollama server is running on port 11434</li>
            <li>Verify there are no firewall rules blocking the connection</li>
            <li>If you've installed Ollama, open a terminal and run <code>ollama serve</code></li>
          </ul>
        </>
      );
    } else {
      return (
        <>
          <p className="mt-2">For remote Ollama connections:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
            <li>Check that your ngrok tunnel or remote server is active</li>
            <li>Verify that the remote server URL is correctly entered</li>
            <li>Make sure the server allows requests from this origin</li>
            <li>Check CORS settings on your remote Ollama server</li>
          </ul>
        </>
      );
    }
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {serviceName} Connection Failed
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-auto h-7 px-2" 
            onClick={onRetry}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </AlertTitle>
      
      <AlertDescription className="space-y-2">
        <p>{message || `Could not connect to ${serviceName} at ${url || 'the configured endpoint'}.`}</p>
        
        {getHelpMessage()}
        
        <div className="flex flex-wrap gap-2 mt-3">
          {onConfigure && (
            <Button size="sm" variant="outline" onClick={onConfigure}>
              Configure {serviceName}
            </Button>
          )}
          
          <a 
            href="https://ollama.ai/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs text-primary-foreground shadow hover:bg-primary/90"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Download Ollama
          </a>
          
          <a 
            href="https://github.com/ollama/ollama/blob/main/docs/troubleshooting.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs ring-offset-background hover:bg-accent hover:text-accent-foreground"
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Troubleshooting Guide
          </a>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ConnectionErrorMessage;
