import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Menu, Bell, Settings, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface MobileNavProps {
  onMenuClick: () => void;
}

export function MobileNav({ onMenuClick }: MobileNavProps) {
  const [location] = useLocation();
  const [showError, setShowError] = useState(false);
  const { openOllamaModal } = useOnboarding();
  
  // Define proper type for status
  interface Status {
    ollama?: {
      status: string;
      endpoint?: string;
      error?: string;
    }
  }
  
  const { data: status } = useQuery<Status>({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  const getPageTitle = () => {
    if (location === '/') return 'Dashboard';
    if (location.startsWith('/chat')) return 'Chat';
    return 'Cognos';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMenuClick}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">{getPageTitle()}</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div 
                    className={`w-2 h-2 rounded-full ${status?.ollama?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
                    onClick={() => setShowError(!showError)}
                  ></div>
                </TooltipTrigger>
                <TooltipContent>
                  {status?.ollama?.status === 'connected' 
                    ? 'Ollama AI is connected and running' 
                    : 'Ollama AI is offline - Click to see details'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge 
              variant={status?.ollama?.status === 'connected' ? 'default' : 'destructive'} 
              className="text-xs px-2 py-0"
              onClick={() => setShowError(!showError)}
            >
              {status?.ollama?.status === 'connected' ? 'AI' : 'Off'}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2" 
            onClick={() => openOllamaModal()}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Mobile error state display */}
      {showError && status?.ollama?.status !== 'connected' && (
        <Alert variant="destructive" className="mt-2 mx-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Ollama AI is offline. {status?.ollama?.error || 'Connection failed.'}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2" 
              onClick={() => openOllamaModal()}
            >
              Configure Ollama
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </header>
  );
}