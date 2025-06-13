import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Activity, Moon, Zap, RefreshCw, Download, TrendingUp } from "lucide-react";

// Define types for the API responses
interface StatusResponse {
  oura?: {
    status: 'connected' | 'disconnected' | string;
    lastSync?: string;
  };
  // Add other status properties as needed
}

interface HealthDataItem {
  dataType: string;
  date: string;
  value: any; // Using 'any' for now since the value structure varies by dataType
  source: string;
  // Add other properties as needed
}

type HealthDataArray = HealthDataItem[];

export function HealthMetrics() {
  const queryClient = useQueryClient();

  const { data: healthData, isLoading, refetch: refetchHealthData } = useQuery<HealthDataArray>({
    queryKey: ['/api/health', { limit: 20 }],
    initialData: [], // Provide empty array as initial data to avoid undefined
    staleTime: 60 * 1000, // Consider data stale after 1 minute
  });

  const { data: status, refetch: refetchStatus } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
    initialData: {}, // Provide empty object as initial data
    staleTime: 60 * 1000, // Consider data stale after 1 minute
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/health/sync', {});
      return response.json();
    },
    onSuccess: async (data) => {
      console.log('Sync successful, refreshing data:', data);
      // Force refetch the data instead of just invalidating
      await Promise.all([
        refetchHealthData(),
        refetchStatus()
      ]);
      
      // Also invalidate queries to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
    },
    onError: (error) => {
      console.error('Sync failed:', error);
    }
  });

  const getLatestData = (dataType: string) => {
    return healthData?.find((item: any) => item.dataType === dataType);
  };

  const sleepData = getLatestData('sleep');
  const activityData = getLatestData('activity');
  const readinessData = getLatestData('readiness');

  // Extract scores from Oura data structure
  const getSleepScore = () => {
    if (!sleepData?.value) return null;
    // Oura sleep data doesn't have a direct score, calculate from efficiency and duration
    const efficiency = sleepData.value.efficiency || 0;
    const duration = sleepData.value.total_sleep_duration || 0;
    const hours = duration / 3600;
    // Simple scoring based on efficiency and duration (7-9 hours optimal)
    let durationScore = hours >= 7 && hours <= 9 ? 100 : Math.max(0, 100 - Math.abs(8 - hours) * 15);
    return Math.round((efficiency + durationScore) / 2);
  };

  const getActivityScore = () => {
    return activityData?.value?.score || null;
  };

  const getReadinessScore = () => {
    return readinessData?.value?.score || sleepData?.value?.readiness?.score || null;
  };

  const formatSleepDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            Health Overview
          </CardTitle>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500">
              {status?.oura?.status === 'connected' 
                ? `Last sync: ${status?.oura?.lastSync ? new Date(status.oura.lastSync).toLocaleTimeString() : 'Never'}` 
                : 'Not connected'}
            </span>
            <Button
              variant="outline" 
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || status?.oura?.status !== 'connected'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status?.oura?.status !== 'connected' ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Oura Ring Not Connected</h3>
            <p className="text-slate-500 mb-4">
              Connect your Oura Ring to view detailed health metrics and get AI-powered insights.
            </p>
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Configure Oura Ring
            </Button>
          </div>
        ) : !healthData || healthData.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Health Data</h3>
            <p className="text-slate-500 mb-4">
              Sync your Oura Ring data to start seeing health metrics and insights.
            </p>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Data Now
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sleep Score */}
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="w-12 h-12 bg-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Moon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Sleep Score</h4>
                <p className="text-2xl font-bold text-purple-600">
                  {getSleepScore() || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  {sleepData?.value?.total_sleep_duration 
                    ? formatSleepDuration(sleepData.value.total_sleep_duration)
                    : 'No data'
                  }
                </p>
              </div>

              {/* Activity Score */}
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-12 h-12 bg-green-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Activity Score</h4>
                <p className="text-2xl font-bold text-green-600">
                  {getActivityScore() || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  {activityData?.value?.steps 
                    ? `${activityData.value.steps.toLocaleString()} steps`
                    : 'No data'
                  }
                </p>
              </div>

              {/* Readiness Score */}
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="w-12 h-12 bg-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-slate-900">Readiness</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {getReadinessScore() || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  {getReadinessScore() 
                    ? getReadinessScore()! >= 85 ? 'Excellent' : 
                      getReadinessScore()! >= 70 ? 'Good' : 'Fair'
                    : 'No data'
                  }
                </p>
              </div>
            </div>

            {/* Detailed Sleep Metrics */}
            {sleepData?.value && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Moon className="h-4 w-4 mr-2" />
                  Sleep Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Deep Sleep</p>
                    <p className="font-medium">
                      {sleepData.value.deep_sleep_duration 
                        ? `${Math.floor(sleepData.value.deep_sleep_duration / 60)}m`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">REM Sleep</p>
                    <p className="font-medium">
                      {sleepData.value.rem_sleep_duration 
                        ? `${Math.floor(sleepData.value.rem_sleep_duration / 60)}m`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Efficiency</p>
                    <p className="font-medium">
                      {sleepData.value.efficiency ? `${sleepData.value.efficiency}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">HRV</p>
                    <p className="font-medium">
                      {sleepData.value.average_hrv ? `${sleepData.value.average_hrv}ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Details */}
            {activityData?.value && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Active Calories</p>
                    <p className="font-medium">
                      {activityData.value.active_calories || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total Calories</p>
                    <p className="font-medium">
                      {activityData.value.total_calories || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Distance</p>
                    <p className="font-medium">
                      {activityData.value.equivalent_walking_distance 
                        ? `${(activityData.value.equivalent_walking_distance / 1000).toFixed(1)} km`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">High Activity</p>
                    <p className="font-medium">
                      {activityData.value.high_activity_met_minutes 
                        ? `${activityData.value.high_activity_met_minutes}min`
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2">
                <Badge variant={status?.oura?.status === 'connected' ? 'default' : 'secondary'}>
                  {status?.oura?.status === 'connected' ? 'Connected' : 'Disconnected'}
                </Badge>
                <span className="text-sm text-slate-500">
                  {healthData?.length || 0} data points
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trends
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
