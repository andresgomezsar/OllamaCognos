import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import { AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.js';

interface OllamaConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  defaultUrl?: string;
}

export function OllamaConfigModal({ open, onClose, onSave, defaultUrl = "http://localhost:11434" }: OllamaConfigModalProps) {
  const [step, setStep] = useState(1);
  const [ollamaUrl, setOllamaUrl] = useState(defaultUrl);
  const [isLocal, setIsLocal] = useState(true);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Reset state when the modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setOllamaUrl(defaultUrl);
      setIsLocal(true);
      setTestResult(null);
    }
  }, [open, defaultUrl]);

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      // Test the Ollama connection
      const response = await fetch(`${ollamaUrl}/api/version`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Cannot connect to Ollama at ${ollamaUrl}`);
      }
      
      const data = await response.json();
      setTestResult({
        success: true,
        message: `Successfully connected to Ollama ${data.version || 'server'}!`,
      });
      
      // Move to the next step after successful connection
      setTimeout(() => {
        setStep(3);
      }, 1000);
      
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to Ollama server',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(ollamaUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Ollama Connection</DialogTitle>
          <DialogDescription>
            Connect your AI assistant to Ollama to enable local language model capabilities.
          </DialogDescription>
        </DialogHeader>
        
        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Choose your Ollama setup:</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={isLocal ? "default" : "outline"}
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setIsLocal(true);
                    setOllamaUrl("http://localhost:11434");
                  }}
                >
                  <div>
                    <p className="font-medium">Local Ollama</p>
                    <p className="text-sm opacity-80">Ollama is installed on this computer</p>
                  </div>
                </Button>
                
                <Button
                  variant={!isLocal ? "default" : "outline"}
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    setIsLocal(false);
                    setOllamaUrl("");
                  }}
                >
                  <div>
                    <p className="font-medium">Remote Ollama</p>
                    <p className="text-sm opacity-80">Connect to Ollama running elsewhere (ngrok or server)</p>
                  </div>
                </Button>
              </div>
            </div>
            
            <Button className="w-full" onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}
        
        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ollama-url">Ollama URL</Label>
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder={isLocal ? "http://localhost:11434" : "https://your-ngrok-url.ngrok.io"}
              />
              <p className="text-xs text-gray-500">
                {isLocal 
                  ? "The default URL for local Ollama installations is http://localhost:11434"
                  : "For remote access, enter your ngrok URL or server address"}
              </p>
            </div>
            
            {!isLocal && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Remote Connection</AlertTitle>
                <AlertDescription>
                  For remote connections, make sure your Ollama server is exposed securely.
                  Consider using <a 
                    href="https://ngrok.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:underline items-center gap-1 inline-flex"
                  >
                    ngrok <ExternalLink className="h-3 w-3" />
                  </a> for secure tunneling.
                </AlertDescription>
              </Alert>
            )}
            
            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success 
                  ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                  : <AlertCircle className="h-4 w-4" />
                }
                <AlertTitle>{testResult.success ? "Connection Successful" : "Connection Failed"}</AlertTitle>
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={testConnection}
                disabled={!ollamaUrl || isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </div>
          </div>
        )}
        
        {step === 3 && (
          <div className="space-y-4 py-4">
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Connection Successful</AlertTitle>
              <AlertDescription>
                Successfully connected to Ollama at {ollamaUrl}
              </AlertDescription>
            </Alert>
            
            <p>
              Your AI assistant is now configured to use Ollama. You can change these settings at any time
              from the settings page.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button onClick={handleSave}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter className="sm:justify-start">
          <div className="w-full flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Step {step} of 3
            </div>
            
            {step !== 3 && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Skip for now
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OllamaConfigModal;
