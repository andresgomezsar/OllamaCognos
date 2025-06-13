interface OuraSleepData {
  id: string;
  day: string;
  score: number;
  total_sleep_duration: number;
  deep_sleep_duration: number;
  rem_sleep_duration: number;
  light_sleep_duration: number;
  efficiency: number;
  bedtime_start: string;
  bedtime_end: string;
  hr_lowest: number;
  hr_average: number;
  rmssd: number;
}

interface OuraActivityData {
  id: string;
  day: string;
  score: number;
  active_calories: number;
  total_calories: number;
  steps: number;
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  medium_activity_met_minutes: number;
  low_activity_met_minutes: number;
  sedentary_met_minutes: number;
}

interface OuraReadinessData {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  activity_balance: number;
  body_temperature: number;
  hrv_balance: number;
  previous_day_activity: number;
  previous_night: number;
  recovery_index: number;
  resting_heart_rate: number;
  sleep_balance: number;
}

export class OuraClient {
  private accessToken: string;
  private baseUrl = 'https://api.ouraring.com/v2/usercollection';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    if (!this.accessToken) {
      throw new Error('Oura access token not configured');
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Oura Ring access token');
        }
        throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch data from Oura Ring API');
    }
  }

  async getSleepData(startDate?: string, endDate?: string): Promise<{ data: OuraSleepData[] }> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.makeRequest<{ data: OuraSleepData[] }>('sleep', params);
  }

  async getActivityData(startDate?: string, endDate?: string): Promise<{ data: OuraActivityData[] }> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.makeRequest<{ data: OuraActivityData[] }>('daily_activity', params);
  }

  async getReadinessData(startDate?: string, endDate?: string): Promise<{ data: OuraReadinessData[] }> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    return this.makeRequest<{ data: OuraReadinessData[] }>('readiness', params);
  }
  
  /**
   * Test the connection to Oura API using the provided access token
   * @returns User info or error if connection fails
   */
  async testConnection(): Promise<{ userId: string }> {
    // We'll use the personal info endpoint which is lightweight and always accessible with a valid token
    const url = 'https://api.ouraring.com/v2/usercollection/personal_info';
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid Oura Ring access token');
        }
        throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { userId: data.id || 'unknown' };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Oura Ring API');
    }
  }

  async getLatestSleep(): Promise<OuraSleepData | null> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];

    const data = await this.getSleepData(startDate);
    return data.data.length > 0 ? data.data[data.data.length - 1] : null;
  }

  async getLatestActivity(): Promise<OuraActivityData | null> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.getActivityData(today);
    return data.data.length > 0 ? data.data[0] : null;
  }

  async getLatestReadiness(): Promise<OuraReadinessData | null> {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.getReadinessData(today);
    return data.data.length > 0 ? data.data[0] : null;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.makeRequest('personal_info');
      return true;
    } catch {
      return false;
    }
  }
}

export const createOuraClient = (accessToken: string) => {
  return new OuraClient(accessToken);
};
