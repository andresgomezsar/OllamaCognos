import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthMetrics } from "@/components/HealthMetrics";
import { Brain, MessageSquare, Heart, Zap, TrendingUp, Activity, Loader2 } from "lucide-react";

// Define interfaces for our API responses
interface StatusResponse {
  ai?: {
    provider?: string;
    status?: string;
  };
  ollama?: {
    status?: string;
    model?: string;
  };
  oura?: {
    status?: string;
  };
  mcpTools?: any[];
}

interface Conversation {
  id: number | string;
  title: string;
  updatedAt: string;
}

interface Tool {
  name: string;
  description: string;
}

export default function Dashboard() {
  const { data: status, isLoading: statusLoading, error: statusError } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: conversations, isLoading: conversationsLoading, error: conversationsError } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['/api/health', { limit: 10 }],
  });

  const { data: tools, isLoading: toolsLoading, error: toolsError } = useQuery<Tool[]>({
    queryKey: ['/api/mcp/tools'],
  });
  
  // Safely access nested properties with proper typing
  const isAIOnline = status?.ollama?.status === 'connected';
  const aiModel = status?.ollama?.model || 'Unknown';
  const conversationCount = conversations?.length || 0;
  const isOuraConnected = status?.oura?.status === 'connected';
  const mcpToolsCount = status?.mcpTools?.length || 0;
  
  // Show loading state while queries are in progress
  const isLoading = statusLoading || conversationsLoading || healthLoading || toolsLoading;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-2 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Check for errors
  const hasError = statusError || conversationsError || healthError || toolsError;
  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">There was a problem loading the dashboard data. Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header - Hidden on mobile when MobileNav is present */}
      <header className="hidden lg:block bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Your personal AI assistant overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAIOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600">
                {isAIOnline ? 'AI Online' : 'AI Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">AI Status</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-900">
                    {isAIOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <Badge variant={isAIOnline ? 'default' : 'destructive'} className="text-xs">
                  {aiModel}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">Conversations</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-900">
                    {conversationCount}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <span className="text-slate-500">Recent Chats</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">Health Data</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-900">
                    {isOuraConnected ? 'Synced' : 'Offline'}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 lg:h-6 lg:w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <Badge variant={isOuraConnected ? 'default' : 'secondary'} className="text-xs">
                  Oura Ring
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">MCP Tools</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-900">
                    {mcpToolsCount}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <span className="text-slate-500">Active Tools</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Health Overview */}
          <div className="lg:col-span-2">
            <HealthMetrics />
          </div>

          {/* System Status & Tools */}
          <div className="space-y-4 lg:space-y-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Activity className="h-5 w-5 mr-2 text-blue-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Ollama Server</span>
                  <Badge variant={isAIOnline ? 'default' : 'destructive'}>
                    {isAIOnline ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Oura Ring</span>
                  <Badge variant={isOuraConnected ? 'default' : 'secondary'}>
                    {isOuraConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Memory Context</span>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </CardContent>
            </Card>

            {/* MCP Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">MCP Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tools && tools.length > 0 ? (
                    tools.map((tool, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{tool.name}</p>
                          <p className="text-xs text-slate-500">{tool.description}</p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-slate-500">
                      No MCP tools available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Conversations</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-0">
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conversation) => (
                      <div key={conversation.id} className="flex items-center justify-between py-2 px-6 hover:bg-slate-50 transition-colors">
                        <span className="text-sm">{conversation.title}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-slate-500">
                      No recent conversations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}