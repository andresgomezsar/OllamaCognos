import { Badge } from "@/components/ui/badge.js";
import { Brain, User, Heart, Clock, Zap } from "lucide-react";

interface ChatMessageProps {
  message: {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: any;
    createdAt: string;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderHealthMetrics = (toolResults: any) => {
    if (!toolResults || toolResults.error) return null;

    return (
      <div className="grid grid-cols-2 gap-3 my-4">
        {toolResults.score && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">
                {toolResults.type === 'sleep' ? 'Sleep Score' : 'Activity Score'}
              </span>
              <Heart className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-700 mt-1">{toolResults.score}</div>
            <div className="text-xs text-green-600">
              {toolResults.score >= 85 ? 'Excellent' : toolResults.score >= 70 ? 'Good' : 'Fair'}
            </div>
          </div>
        )}
        
        {toolResults.duration && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Duration</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{toolResults.duration}</div>
            <div className="text-xs text-blue-600">Total sleep</div>
          </div>
        )}
        
        {toolResults.steps && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">Steps</span>
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-700 mt-1">{toolResults.steps.toLocaleString()}</div>
            <div className="text-xs text-purple-600">Today</div>
          </div>
        )}
        
        {toolResults.calories && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-700">Calories</span>
              <Zap className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700 mt-1">{toolResults.calories}</div>
            <div className="text-xs text-orange-600">Active</div>
          </div>
        )}
      </div>
    );
  };

  if (isUser) {
    return (
      <div className="max-w-3xl mx-auto px-2 lg:px-0">
        <div className="flex justify-end">
          <div className="max-w-[280px] sm:max-w-xs lg:max-w-md">
            <div className="bg-blue-500 text-white rounded-2xl rounded-tr-md px-3 lg:px-4 py-2 lg:py-3">
              <p className="whitespace-pre-wrap text-sm lg:text-base">{message.content}</p>
            </div>
            <div className="text-xs text-slate-500 mt-1 text-right">
              {formatTime(message.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAssistant) {
    return (
      <div className="max-w-3xl mx-auto px-2 lg:px-0">
        <div className="flex">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-2 lg:mr-3 flex-shrink-0">
            <Brain className="h-3 w-3 lg:h-4 lg:w-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md p-3 lg:p-4">
              <div className="whitespace-pre-wrap text-slate-900 mb-2 text-sm lg:text-base">
                {message.content}
              </div>
              
              {message.metadata?.toolResults && renderHealthMetrics(message.metadata.toolResults)}
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <div className="flex items-center space-x-2">
                <span>{formatTime(message.createdAt)}</span>
                {message.metadata?.tools && (
                  <div className="flex items-center space-x-1">
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {message.metadata.tools.includes('health-analysis') ? 'Health Data' : 'AI Response'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
