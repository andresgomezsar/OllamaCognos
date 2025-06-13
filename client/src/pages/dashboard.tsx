import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthMetrics } from "@/components/HealthMetrics";
import { Brain, MessageSquare, Heart, Zap, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: conversations } = useQuery({
    queryKey: ['/api/conversations'],
  });

  const { data: healthData } = useQuery({
    queryKey: ['/api/health', { limit: 10 }],
  });

  const { data: tools } = useQuery({
    queryKey: ['/api/mcp/tools'],
  });

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
              <div className={`w-2 h-2 rounded-full ${(status as any)?.ollama?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-slate-600">
                {(status as any)?.ollama?.status === 'connected' ? 'AI Online' : 'AI Offline'}
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
                    {(status as any)?.ollama?.status === 'connected' ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <Badge variant={(status as any)?.ollama?.status === 'connected' ? 'default' : 'destructive'} className="text-xs">
                  {(status as any)?.ollama?.model || 'Unknown'}
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
                    {(conversations as any)?.length || 0}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">Active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-slate-500 font-medium">Health Data</p>
                  <p className="text-lg lg:text-2xl font-bold text-slate-900">
                    {(status as any)?.oura?.status === 'connected' ? 'Synced' : 'Offline'}
                  </p>
                </div>
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 lg:h-6 lg:w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                <Badge variant={(status as any)?.oura?.status === 'connected' ? 'default' : 'secondary'} className="text-xs">
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
                    {(status as any)?.mcpTools?.length || 0}
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
                  <Badge variant={status?.ollama?.status === 'connected' ? 'default' : 'destructive'}>
                    {status?.ollama?.status === 'connected' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Oura Ring</span>
                  <Badge variant={status?.oura?.status === 'connected' ? 'default' : 'secondary'}>
                    {status?.oura?.status === 'connected' ? 'Connected' : 'Not Connected'}
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
                  {tools?.map((tool: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{tool.name}</p>
                        <p className="text-xs text-slate-500">{tool.description}</p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversations?.slice(0, 3).map((conv: any) => (
                    <div key={conv.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="font-medium text-slate-900 truncate">{conv.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {(!conversations || conversations.length === 0) && (
                    <p className="text-sm text-slate-500 text-center py-4">
                      No conversations yet. Start chatting with your AI assistant!
                    </p>
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
