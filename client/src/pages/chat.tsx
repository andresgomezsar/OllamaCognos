import { useState, useEffect, useRef } from "react";
// Import wouter from our compatibility layer
const { useParams } = require("../wouter-compat");
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/components/ChatMessage";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Send, Plus, Settings, Heart, Zap } from "lucide-react";
import { ConnectionErrorMessage } from "@/components/errors/ConnectionErrorMessage";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

export default function Chat() {
  const { conversationId } = useParams();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { openOllamaModal } = useOnboarding();

  const { socket, isConnected, sendMessage } = useWebSocket();

  // Define proper types for our data
  interface Conversation {
    id: number;
    title: string;
    createdAt: string;
  }
  
  interface ChatMessage {
    id: number;
    conversationId: number;
    content: string;
    role: string;
    createdAt: string;
  }
  
  interface Status {
    ollama?: {
      status: string;
      endpoint?: string;
      error?: string;
    },
    oura?: {
      status: string;
      token?: string;
    }
  }
  
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
  });

  const { data: status = {} } = useQuery<Status>({
    queryKey: ['/api/status'],
    refetchInterval: 30000,
  });

  interface HealthData {
    dataType: string;
    value: any;
    timestamp?: string;
  }

  const { data: healthData = [] } = useQuery<HealthData[]>({
    queryKey: ['/api/health', { limit: 5 }],
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest('POST', '/api/conversations', { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        // Invalidate messages query to refetch
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations', data.conversationId, 'messages'] 
        });
        setIsTyping(false);
      } else if (data.type === 'typing') {
        setIsTyping(true);
      } else if (data.type === 'error') {
        console.error('Chat error:', data.message);
        setIsTyping(false);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, queryClient]);

  const handleSendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    const messageText = message.trim();
    setMessage("");

    try {
      if (conversationId) {
        // Send to existing conversation
        sendMessage({
          type: 'chat',
          conversationId: parseInt(conversationId),
          content: messageText,
          userId: 1
        });
      } else {
        // Create new conversation first
        const newConv = await createConversationMutation.mutateAsync(
          messageText.substring(0, 50) + (messageText.length > 50 ? '...' : '')
        );
        
        sendMessage({
          type: 'chat',
          conversationId: newConv.id,
          content: messageText,
          userId: 1
        });

        // Navigate to new conversation
        window.history.pushState({}, '', `/chat/${newConv.id}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentConversation = conversations.find(c => c.id === parseInt(conversationId || '0'));

  return (
    <>
      {/* Header - Hidden on mobile when MobileNav is present */}
      <header className="hidden lg:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {currentConversation?.title || 'New Chat'}
            </h1>
            <p className="text-slate-500">
              Powered by Ollama • Health-focused • Memory enabled
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${(status as any)?.ollama?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600">
                {(status as any)?.ollama?.status === 'connected' ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => openOllamaModal()}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        {/* Ollama connection error message */}
        {(status as any)?.ollama?.status !== 'connected' && (
          <div className="mt-4">
            <ConnectionErrorMessage 
              serviceName="Ollama" 
              url={(status as any)?.ollama?.endpoint || 'the configured endpoint'}
              message={(status as any)?.ollama?.error || 'Failed to connect to Ollama service.'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/status'] })}
              onConfigure={() => openOllamaModal()}
            />
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Chat Sidebar - Hidden on mobile, shown as modal or separate view */}
        <div className="hidden lg:flex w-80 bg-white border-r border-slate-200 flex-col">
          <div className="p-4 border-b border-slate-200">
            <Button className="w-full" onClick={() => window.location.href = '/chat'}>
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {conversations?.map((conv: any) => (
              <div
                key={conv.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  conv.id === parseInt(conversationId || '0') 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
                onClick={() => window.location.href = `/chat/${conv.id}`}
              >
                <p className="font-medium text-slate-900 truncate">{conv.title}</p>
                <p className="text-sm text-slate-500 truncate">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
            
            {(!conversations || conversations.length === 0) && (
              <p className="text-sm text-slate-500 text-center py-8">
                No conversations yet
              </p>
            )}
          </div>
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
            {!conversationId && (
              <div className="max-w-3xl mx-auto">
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-100">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Brain className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-2">Welcome to Cognos!</h3>
                        <p className="text-slate-700 mb-4">
                          I'm your personal AI assistant with access to your health data and web search capabilities. I can help you with:
                        </p>
                        <ul className="space-y-2 text-sm text-slate-600">
                          <li className="flex items-center">
                            <Heart className="h-4 w-4 text-green-500 mr-2" />
                            Analyze your Oura Ring health metrics
                          </li>
                          <li className="flex items-center">
                            <Brain className="h-4 w-4 text-blue-500 mr-2" />
                            Remember our previous conversations
                          </li>
                          <li className="flex items-center">
                            <Zap className="h-4 w-4 text-orange-500 mr-2" />
                            Search the web for current information
                          </li>
                          <li className="flex items-center">
                            <Heart className="h-4 w-4 text-purple-500 mr-2" />
                            Provide personalized health insights
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {conversationId && messages?.map((msg: any) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isTyping && (
              <div className="max-w-3xl mx-auto">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Brain className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-sm text-slate-500 ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 bg-white p-3 lg:p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end space-x-2 lg:space-x-3">
                <div className="flex-1">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything about your health, or just chat..."
                    className="resize-none min-h-[44px] max-h-32 text-sm lg:text-base"
                    disabled={!isConnected || (status as any)?.ollama?.status !== 'connected'}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <div className="flex items-center space-x-2 lg:space-x-4">
                      <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
                      <span className="sm:hidden">Enter to send</span>
                      <Badge variant="outline" className="text-xs">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <span>{message.length} / 4000</span>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected || (status as any)?.ollama?.status !== 'connected'}
                  size="sm"
                  className="px-3 lg:px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Health Sidebar - Hidden on mobile */}
        <div className="hidden lg:block w-80 bg-slate-50 border-l border-slate-200 p-4 overflow-y-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Heart className="h-5 w-5 mr-2 text-green-500" />
                Today's Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthData?.slice(0, 3).map((data: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 capitalize">{data.dataType}</span>
                  <span className="font-medium">
                    {data.dataType === 'sleep' && data.value?.score ? `${data.value.score}/100` : 
                     data.dataType === 'activity' && data.value?.steps ? `${data.value.steps} steps` :
                     'No data'}
                  </span>
                </div>
              ))}
              {(!healthData || healthData.length === 0) && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No health data available. Connect your Oura Ring to get started.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="h-5 w-5 mr-2 text-blue-500" />
                Active Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center mr-2">
                    <Heart className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">Oura Ring</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${status?.oura?.status === 'connected' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center mr-2">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">Web Search</span>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center mr-2">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
