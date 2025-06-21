import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { Badge } from '@/components/ui/badge.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.js';
import { Progress } from '@/components/ui/progress.js';
import { useToast } from '@/hooks/use-toast.js';
import { healthApi, statusApi } from '@/lib/api.js';
import { 
  Heart, 
  Activity, 
  Moon, 
  Zap, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

export default function HealthPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDateRange, setSelectedDateRange] = useState('7d');

  const { data: healthData, isLoading } = useQuery({
    queryKey: ['/api/health', { limit: 50 }],
    queryFn: () => healthApi.getHealthData({ limit: 50 }),
  });

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    queryFn: statusApi.getStatus,
  });

  const syncMutation = useMutation({
    mutationFn: healthApi.syncHealthData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health'] });
      toast({
        title: "Sync complete",
        description: "Health data has been updated from your devices.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync health data",
        variant: "destructive",
      });
    },
  });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const processHealthData = (data: any[]) => {
    const latest = {
      sleep: data.filter(d => d.dataType === 'sleep').slice(0, 1)[0],
      activity: data.filter(d => d.dataType === 'activity').slice(0, 1)[0],
      readiness: data.filter(d => d.dataType === 'readiness').slice(0, 1)[0],
      hrv: data.filter(d => d.dataType === 'hrv').slice(0, 1)[0],
    };

    const trends = {
      sleep: calculateTrend(data.filter(d => d.dataType === 'sleep').slice(0, 7)),
      activity: calculateTrend(data.filter(d => d.dataType === 'activity').slice(0, 7)),
      readiness: calculateTrend(data.filter(d => d.dataType === 'readiness').slice(0, 7)),
    };

    return { latest, trends };
  };

  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return 0;
    const recent = data[0]?.value?.score || 0;
    const previous = data[1]?.value?.score || 0;
    return recent - previous;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Health Data</h1>
        </div>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const { latest, trends } = healthData ? processHealthData(healthData) : { latest: {}, trends: {} };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Health Data</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`h-2 w-2 rounded-full ${
              status?.oura?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            Oura Ring {status?.oura?.status === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
          
          <Button 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || status?.oura?.status !== 'connected'}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
        </div>
      </div>

      {!status?.oura?.configured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Connect Your Oura Ring</p>
                <p className="text-sm text-yellow-700">
                  To view your health data, please configure your Oura Ring token in Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sleep Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleep Score</CardTitle>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${getScoreColor(latest.sleep?.value?.score || 0)}`}>
                      {latest.sleep?.value?.score || '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latest.sleep?.timestamp ? format(parseISO(latest.sleep.timestamp), 'MMM d') : 'No data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.sleep || 0)}
                    {getScoreBadge(latest.sleep?.value?.score || 0)}
                  </div>
                </div>
                <Progress 
                  value={latest.sleep?.value?.score || 0} 
                  className="mt-3" 
                />
              </CardContent>
            </Card>

            {/* Activity Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${getScoreColor(latest.activity?.value?.score || 0)}`}>
                      {latest.activity?.value?.score || '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latest.activity?.timestamp ? format(parseISO(latest.activity.timestamp), 'MMM d') : 'No data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.activity || 0)}
                    {getScoreBadge(latest.activity?.value?.score || 0)}
                  </div>
                </div>
                <Progress 
                  value={latest.activity?.value?.score || 0} 
                  className="mt-3" 
                />
              </CardContent>
            </Card>

            {/* Readiness Score */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${getScoreColor(latest.readiness?.value?.score || 0)}`}>
                      {latest.readiness?.value?.score || '--'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {latest.readiness?.timestamp ? format(parseISO(latest.readiness.timestamp), 'MMM d') : 'No data'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trends.readiness || 0)}
                    {getScoreBadge(latest.readiness?.value?.score || 0)}
                  </div>
                </div>
                <Progress 
                  value={latest.readiness?.value?.score || 0} 
                  className="mt-3" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Health Metrics</CardTitle>
              <CardDescription>Your latest health data from connected devices</CardDescription>
            </CardHeader>
            <CardContent>
              {healthData && healthData.length > 0 ? (
                <div className="space-y-4">
                  {healthData.slice(0, 10).map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.dataType === 'sleep' && <Moon className="h-5 w-5 text-blue-500" />}
                        {item.dataType === 'activity' && <Activity className="h-5 w-5 text-green-500" />}
                        {item.dataType === 'readiness' && <Zap className="h-5 w-5 text-orange-500" />}
                        {item.dataType === 'hrv' && <Heart className="h-5 w-5 text-red-500" />}
                        <div>
                          <p className="font-medium capitalize">{item.dataType}</p>
                          <p className="text-sm text-gray-600">
                            {format(parseISO(item.timestamp), 'MMM d, yyyy - h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.value?.score || 'N/A'}</p>
                        <p className="text-sm text-gray-600 capitalize">{item.source}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No health data available</p>
                  <p className="text-sm text-gray-500">Connect your devices to start tracking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sleep">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Sleep Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.sleep ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round((latest.sleep.value.total_sleep_duration || 0) / 3600)}h</p>
                    <p className="text-sm text-gray-600">Total Sleep</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.sleep.value.efficiency || 0}%</p>
                    <p className="text-sm text-gray-600">Efficiency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round((latest.sleep.value.deep_sleep_duration || 0) / 3600)}h</p>
                    <p className="text-sm text-gray-600">Deep Sleep</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round((latest.sleep.value.rem_sleep_duration || 0) / 3600)}h</p>
                    <p className="text-sm text-gray-600">REM Sleep</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600">No sleep data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.activity ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.activity.value.steps || 0}</p>
                    <p className="text-sm text-gray-600">Steps</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.activity.value.active_calories || 0}</p>
                    <p className="text-sm text-gray-600">Active Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{Math.round((latest.activity.value.equivalent_walking_distance || 0) / 1000)}km</p>
                    <p className="text-sm text-gray-600">Distance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.activity.value.high_activity_met_minutes || 0}</p>
                    <p className="text-sm text-gray-600">High Activity</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600">No activity data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Readiness Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latest.readiness ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.readiness.value.recovery_index || 0}</p>
                    <p className="text-sm text-gray-600">Recovery Index</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.readiness.value.resting_heart_rate || 0}</p>
                    <p className="text-sm text-gray-600">Resting HR</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.readiness.value.hrv_balance || 0}</p>
                    <p className="text-sm text-gray-600">HRV Balance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{latest.readiness.value.body_temperature || 0}°</p>
                    <p className="text-sm text-gray-600">Body Temp</p>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-600">No readiness data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}