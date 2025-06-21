import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import { Switch } from '@/components/ui/switch.js';
import { Badge } from '@/components/ui/badge.js';
import { Separator } from '@/components/ui/separator.js';
import { useToast } from '@/hooks/use-toast.js';
import { settingsApi, statusApi, configApi } from '@/lib/api.js';
import { Settings, Zap, Shield, Database, Bot, Activity, Watch, PanelRightOpen } from 'lucide-react';

// Define interface for configuration items
interface ConfigItem {
  key: string;
  value: string;
  category?: string;
  displayName?: string;
  encrypted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: settingsApi.getSettings,
  });

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/status'],
    queryFn: statusApi.getStatus,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      toast({
        title: "Settings updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    ollamaUrl: '',
    ollamaModel: '',
    limitlessApiToken: '',
    perplexityApiToken: '',
    openrouterApiToken: '',
    groqApiToken: '',
    selectedProvider: 'ollama',
    enabledMcpTools: [],
    healthDataSources: [],
    privacyLevel: 'standard',
    dataRetentionDays: 365,
  });

  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState<{success: boolean; message: string} | null>(null);
  
  const [testingLimitless, setTestingLimitless] = useState(false);
  const [limitlessTestResult, setLimitlessTestResult] = useState<{success: boolean; message: string} | null>(null);

  const [testingPerplexity, setTestingPerplexity] = useState(false);
  const [perplexityTestResult, setPerplexityTestResult] = useState<{success: boolean; message: string} | null>(null);

  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{success: boolean; message: string} | null>(null);

  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{success: boolean; message: string} | null>(null);

  // Load configuration data
  const { data: configurations } = useQuery({
    queryKey: ['/api/config'],
    queryFn: () => configApi.getAllConfiguration(),
  });

  // Update form data when settings load
  useEffect(() => {
    if (settings?.data) {
      setFormData(prevState => ({
        ...prevState,
        ollamaUrl: settings.data.ollamaUrl,
        ollamaModel: settings.data.ollamaModel,
        enabledMcpTools: settings.data.enabledMcpTools || [],
        healthDataSources: settings.data.healthDataSources || [],
        privacyLevel: settings.data.privacyLevel || 'standard',
        dataRetentionDays: settings.data.dataRetentionDays || 90,
        selectedProvider: settings.data.selectedProvider || 'ollama',
      }));
    }
  }, [settings]);
  
  // Update token fields from configuration
  useEffect(() => {
    if (configurations?.data) {
      const limitlessToken = configurations.data.find((config: ConfigItem) => config.key === 'LIMITLESS_API_TOKEN');
      const perplexityToken = configurations.data.find((config: ConfigItem) => config.key === 'PERPLEXITY_API_TOKEN');
      const openrouterToken = configurations.data.find((config: ConfigItem) => config.key === 'OPENROUTER_API_TOKEN');
      const groqToken = configurations.data.find((config: ConfigItem) => config.key === 'GROQ_API_TOKEN');
      
      setFormData(prev => ({
        ...prev,
        limitlessApiToken: limitlessToken?.value || '',
        perplexityApiToken: perplexityToken?.value || '',
        openrouterApiToken: openrouterToken?.value || '',
        groqApiToken: groqToken?.value || '',
        selectedProvider: prev.selectedProvider || 
          (openrouterToken?.value ? 'openrouter' : 
           groqToken?.value ? 'groq' : 
           perplexityToken?.value ? 'perplexity' : 'ollama')
      }));
    }
  }, [configurations?.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(formData);
  };

  const testOllamaConnection = async () => {
    try {
      setTestingOllama(true);
      setOllamaTestResult(null);
      
      // Use our backend proxy to test the Ollama connection
      const response = await fetch('/api/ollama/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ url: formData.ollamaUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test Ollama connection');
      }
      
      const result = await response.json();
      
      setOllamaTestResult({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      setOllamaTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to connect to Ollama server',
      });
    } finally {
      setTestingOllama(false);
    }
  };
  
  const testLimitlessConnection = async () => {
    if (!formData.limitlessApiToken) {
      setLimitlessTestResult({
        success: false,
        message: 'Please enter a Limitless API token',
      });
      return;
    }
    
    try {
      setTestingLimitless(true);
      setLimitlessTestResult(null);
      
      // First save the token to configuration
      if (formData.limitlessApiToken) {
        await configApi.updateConfiguration('LIMITLESS_API_TOKEN', formData.limitlessApiToken, 'api', 'Limitless API Token', true);
      }
      
      // Then test the connection
      const result = await configApi.testConnection('LIMITLESS_API_TOKEN');
      setLimitlessTestResult(result);
    } catch (error) {
      setLimitlessTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setTestingLimitless(false);
    }
  };

  if (settingsLoading || statusLoading) {
    return (
      <div className="p-6 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Configuration
            </CardTitle>
            <CardDescription>
              Configure your AI assistant settings and model preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current AI Provider */}
            <div className="space-y-2">
              <Label>Current AI Provider</Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">
                      {status?.ai?.provider === 'openrouter' ? 'OpenRouter' : 'Ollama Local'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Model: {status?.ai?.model}
                    </p>
                  </div>
                </div>
                {getStatusBadge(status?.ai?.status || 'unknown')}
              </div>
            </div>

            {/* Ollama Fallback Settings */}
            <Separator />
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Ollama Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ollamaUrl" className="flex items-center justify-between">
                    <span>Ollama URL</span>
                    {ollamaTestResult && (
                      <span className={`text-xs ${ollamaTestResult.success ? 'text-green-500' : 'text-red-500'}`}>
                        {ollamaTestResult.success ? '✓ Connected' : '✗ Failed'}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="ollamaUrl"
                      value={formData.ollamaUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, ollamaUrl: e.target.value });
                        setOllamaTestResult(null);
                      }}
                      placeholder="http://localhost:11434"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={testOllamaConnection} 
                      className="whitespace-nowrap"
                      disabled={testingOllama || !formData.ollamaUrl}
                    >
                      {testingOllama ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                  {ollamaTestResult && (
                    <p className={`text-sm ${ollamaTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                      {ollamaTestResult.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Local Ollama: http://localhost:11434 or use an ngrok URL for remote access
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ollamaModel">Ollama Model</Label>
                  <Input
                    id="ollamaModel"
                    value={formData.ollamaModel}
                    onChange={(e) => setFormData({ ...formData, ollamaModel: e.target.value })}
                    placeholder="qwen3:14b"
                  />
                  <p className="text-xs text-gray-500">
                    Recommended: qwen3:14b, qwen2.5vl:32b, deepseek-r1:32b, llama3.2-vision
                  </p>
                </div>
              </div>
              
              {/* Limitless API Integration */}
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Limitless Pendant Integration</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="limitlessApiToken" className="flex items-center justify-between">
                    <span>Limitless API Token</span>
                    {limitlessTestResult && (
                      <span className={`text-xs ${limitlessTestResult.success ? 'text-green-500' : 'text-red-500'}`}>
                        {limitlessTestResult.success ? '✓ Connected' : '✗ Failed'}
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="limitlessApiToken"
                      value={formData.limitlessApiToken}
                      onChange={(e) => {
                        setFormData({ ...formData, limitlessApiToken: e.target.value });
                        setLimitlessTestResult(null);
                      }}
                      type="password"
                      placeholder="Enter your Limitless API token"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={testLimitlessConnection} 
                      className="whitespace-nowrap"
                      disabled={testingLimitless || !formData.limitlessApiToken}
                    >
                      {testingLimitless ? 'Testing...' : 'Test Connection'}
                    </Button>
                  </div>
                  {limitlessTestResult && (
                    <p className={`text-sm ${limitlessTestResult.success ? 'text-green-600' : 'text-red-500'}`}>
                      {limitlessTestResult.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Get your API token from the Limitless AI developer dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">Ollama Status</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {status?.ollama?.status === 'connected' ? 'Connected to Ollama server' : 'Disconnected from Ollama'}
                    </p>
                  </div>
                </div>
                {getStatusBadge(status?.ollama?.status || 'unknown')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Data Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Data Integration
            </CardTitle>
            <CardDescription>
              Manage your health data sources and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Oura Ring</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sleep, activity, and readiness data
                  </p>
                </div>
              </div>
              {getStatusBadge(status?.oura?.status || 'unknown')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention (days)</Label>
              <Input
                id="dataRetention"
                type="number"
                min="30"
                max="3650"
                value={formData.dataRetentionDays}
                onChange={(e) => setFormData({ ...formData, dataRetentionDays: parseInt(e.target.value) })}
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                How long to keep your health data (30-3650 days)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>
              Control how your data is processed and stored
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="privacyLevel">Privacy Level</Label>
              <select
                id="privacyLevel"
                value={formData.privacyLevel}
                onChange={(e) => setFormData({ ...formData, privacyLevel: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-background"
              >
                <option value="minimal">Minimal - Basic functionality only</option>
                <option value="standard">Standard - Balanced privacy and features</option>
                <option value="enhanced">Enhanced - Full feature access</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Data Processing Consent</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Control how your data is used by AI features</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium">Health Data Analysis</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow AI to analyze your health patterns
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium">Conversation Memory</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remember context across conversations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium">External Tool Access</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow web search and external integrations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MCP Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Available Tools
            </CardTitle>
            <CardDescription>
              Model Context Protocol tools for enhanced capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Web Search</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Search the web for current information</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Health Analysis</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyze your health data patterns</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Memory System</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remember important information</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Oura Sync</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sync data from Oura Ring</p>
                </div>
                <Switch defaultChecked={status?.oura?.configured} disabled={!status?.oura?.configured} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">Limitless Pendant</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Access Limitless Pendant lifelogs</p>
                </div>
                <Switch 
                  defaultChecked={Boolean(formData.limitlessApiToken)} 
                  disabled={!formData.limitlessApiToken} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="outline">
            Reset to Defaults
          </Button>
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}