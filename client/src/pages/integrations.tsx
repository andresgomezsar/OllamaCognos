import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Badge } from '@/components/ui/badge.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { Separator } from '@/components/ui/separator.js';
import { Progress } from '@/components/ui/progress.js';
import { Switch } from '@/components/ui/switch.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import { useToast } from '@/hooks/use-toast.js';
import { statusApi, settingsApi } from '@/lib/api.js';

// Icons
import {
  Link2,
  Bot,
  Heart,
  Activity,
  Cloud,
  Database,
  Layers,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  Settings,
  ExternalLink
} from 'lucide-react';

export default function IntegrationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get status and settings data
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['/api/status'],
    queryFn: statusApi.getStatus,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: settingsApi.getSettings,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: "Integration updated",
        description: "Your integration settings have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update integration settings",
        variant: "destructive",
      });
    },
  });

  // State for testing connections
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResult, setConnectionResult] = useState<{
    service: string;
    success: boolean;
    message: string;
  } | null>(null);

  // Test an integration connection
  const testConnection = async (service: string, url?: string) => {
    setTestingConnection(service);
    setConnectionResult(null);

    try {
      let success = false;
      let message = '';

      switch (service) {
        case 'ollama':
          const response = await fetch(`${url || settings?.ollamaUrl || 'http://localhost:11434'}/api/version`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          
          if (!response.ok) throw new Error(`Cannot connect to Ollama`);
          
          const data = await response.json();
          success = true;
          message = `Connected to Ollama ${data.version || 'server'}!`;
          break;

        case 'oura':
          // This would be handled by the backend
          if (status?.oura?.status === 'connected') {
            success = true;
            message = 'Connected to Oura API';
          } else {
            success = false;
            message = 'Not connected to Oura API';
          }
          break;

        // Add other services as needed
        default:
          throw new Error(`Unknown service: ${service}`);
      }

      setConnectionResult({ service, success, message });
    } catch (error) {
      setConnectionResult({
        service,
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTestingConnection(null);
    }
  };

  // Handle toggle for enabling/disabling integrations
  const handleIntegrationToggle = (integration: string, enabled: boolean) => {
    if (!settings) return;
    
    const enabledTools = [...(settings.enabledMcpTools || [])];
    
    if (enabled && !enabledTools.includes(integration)) {
      enabledTools.push(integration);
    } else if (!enabled && enabledTools.includes(integration)) {
      const index = enabledTools.indexOf(integration);
      if (index > -1) enabledTools.splice(index, 1);
    }
    
    updateSettingsMutation.mutate({ ...settings, enabledMcpTools: enabledTools });
  };

  // Helper to get status badge based on connection state
  const getStatusBadge = (connected: boolean, pending: boolean = false, configured: boolean = true) => {
    if (pending) {
      return <Badge variant="outline" className="animate-pulse">Checking...</Badge>;
    }
    
    if (!configured) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-500">Not Configured</Badge>;
    }
    
    if (connected) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>;
    }
    
    return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Disconnected</Badge>;
  };

  // Loading state
  if (statusLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Integrations</h1>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 w-1/3 rounded"></div>
                <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Integrations</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchStatus()}>
          <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''} mr-2`} />
          Refresh Status
        </Button>
      </div>

      <div className="space-y-6">
        {/* AI Models Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              AI Models
            </CardTitle>
            <CardDescription>
              Configure your local or cloud AI model providers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ollama Integration */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Ollama</h3>
                    {getStatusBadge(status?.ollama?.status === 'connected', testingConnection === 'ollama')}
                  </div>
                  <p className="text-sm text-gray-500">Run open-source AI models locally on your device</p>
                </div>
                <div>
                  <Switch 
                    checked={status?.ollama?.status === 'connected'}
                    onCheckedChange={() => {}}
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="ollamaUrl">Ollama URL</Label>
                    <Input 
                      id="ollamaUrl" 
                      value={settings?.ollamaUrl || 'http://localhost:11434'} 
                      disabled={updateSettingsMutation.isPending}
                      onChange={(e) => {
                        if (settings) {
                          updateSettingsMutation.mutate({
                            ...settings,
                            ollamaUrl: e.target.value
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ollamaModel">Model</Label>
                    <Input 
                      id="ollamaModel" 
                      value={settings?.ollamaModel || 'mistral:latest'} 
                      disabled={updateSettingsMutation.isPending}
                      onChange={(e) => {
                        if (settings) {
                          updateSettingsMutation.mutate({
                            ...settings,
                            ollamaModel: e.target.value
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {connectionResult?.service === 'ollama' && (
                  <div className={`p-3 rounded-md text-sm ${
                    connectionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {connectionResult.success ? <Check className="h-4 w-4 inline mr-2" /> : <X className="h-4 w-4 inline mr-2" />}
                    {connectionResult.message}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => testConnection('ollama')}
                    disabled={testingConnection !== null}
                  >
                    {testingConnection === 'ollama' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    Test Connection
                  </Button>
                </div>
              </div>
            </div>

            {/* Cloud AI Providers */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">OpenRouter</h3>
                    {getStatusBadge(status?.ai?.provider === 'openrouter' && status?.ai?.status === 'connected', false, !!process.env.OPENROUTER_API_KEY)}
                  </div>
                  <p className="text-sm text-gray-500">Access cloud AI models (Claude, GPT-4, etc)</p>
                </div>
                <div>
                  <Switch 
                    checked={status?.ai?.provider === 'openrouter'}
                    disabled
                  />
                </div>
              </div>
              
              <div className="mt-3 text-sm">
                <div className="flex gap-2 items-center text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Configure OpenRouter API key in server environment variables
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Data Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Health Data
            </CardTitle>
            <CardDescription>
              Connect your health tracking devices and services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Oura Integration */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Oura Ring</h3>
                    {getStatusBadge(status?.oura?.status === 'connected', testingConnection === 'oura', status?.oura?.configured)}
                  </div>
                  <p className="text-sm text-gray-500">Sleep, activity, and readiness tracking from Oura Ring</p>
                </div>
                <div>
                  <Switch 
                    checked={status?.oura?.status === 'connected'}
                    disabled
                  />
                </div>
              </div>

              <div className="mt-4">
                {status?.oura?.configured ? (
                  <div className="space-y-4">
                    {connectionResult?.service === 'oura' && (
                      <div className={`p-3 rounded-md text-sm ${
                        connectionResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {connectionResult.success ? <Check className="h-4 w-4 inline mr-2" /> : <X className="h-4 w-4 inline mr-2" />}
                        {connectionResult.message}
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testConnection('oura')}
                        disabled={testingConnection !== null}
                      >
                        {testingConnection === 'oura' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                        Test Connection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    <p>Oura integration requires an API token.</p>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Set Up Oura Integration
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Placeholder for future integrations */}
            <div className="border border-dashed rounded-lg p-4">
              <div className="flex items-center justify-between text-gray-500">
                <div className="space-y-1">
                  <h3 className="font-medium">Apple Health</h3>
                  <p className="text-sm">Coming soon - Sync data from Apple Health</p>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>

            <div className="border border-dashed rounded-lg p-4">
              <div className="flex items-center justify-between text-gray-500">
                <div className="space-y-1">
                  <h3 className="font-medium">Fitbit</h3>
                  <p className="text-sm">Coming soon - Sync data from Fitbit devices</p>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MCP Tools & External Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-violet-500" />
              MCP Tools & External Services
            </CardTitle>
            <CardDescription>
              Enable or disable Model Context Protocol tools
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Perplexity Integration */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Perplexity</h3>
                    {getStatusBadge(status?.perplexity?.status === 'connected', false, status?.perplexity?.configured)}
                  </div>
                  <p className="text-sm text-gray-500">AI-powered web search engine for accurate, up-to-date information</p>
                </div>
                <Switch 
                  checked={settings?.enabledMcpTools?.includes('web_search')}
                  onCheckedChange={(checked) => handleIntegrationToggle('web_search', checked)} 
                />
              </div>
              
              {status?.perplexity?.status !== 'connected' && (
                <div className="mt-3 p-3 bg-amber-50 rounded-md text-sm">
                  <div className="flex gap-2 items-center text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    Configure Perplexity API key in server environment variables
                  </div>
                </div>
              )}

              <div className="mt-3 text-sm text-gray-600">
                <p>Perplexity provides web search capabilities to answer questions about current events and factual information.</p>
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs"
                    onClick={() => window.open('https://docs.perplexity.ai/', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Learn more
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Web Search</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Search the web for current information</p>
                </div>
                <Switch 
                  checked={settings?.enabledMcpTools?.includes('web_search')}
                  onCheckedChange={(checked) => handleIntegrationToggle('web_search', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Health Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your health data patterns</p>
                </div>
                <Switch 
                  checked={settings?.enabledMcpTools?.includes('health_analysis')}
                  onCheckedChange={(checked) => handleIntegrationToggle('health_analysis', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Memory System</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remember important information</p>
                </div>
                <Switch 
                  checked={settings?.enabledMcpTools?.includes('memory_system')}
                  onCheckedChange={(checked) => handleIntegrationToggle('memory_system', checked)} 
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Oura Data Access</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Access to Oura Ring data</p>
                </div>
                <Switch 
                  checked={settings?.enabledMcpTools?.includes('oura_access')}
                  onCheckedChange={(checked) => handleIntegrationToggle('oura_access', checked)}
                  disabled={!status?.oura?.configured} 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button
              variant="default"
              onClick={() => {
                if (settings) {
                  // Reset all MCP tools to disabled
                  updateSettingsMutation.mutate({
                    ...settings,
                    enabledMcpTools: []
                  });
                }
              }}
              disabled={updateSettingsMutation.isPending || !settings?.enabledMcpTools?.length}
            >
              Reset All Permissions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
