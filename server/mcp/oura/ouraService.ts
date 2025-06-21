// Using native fetch API (available in Node.js 18+)
// If on Node.js <18, you'll need to add node-fetch as a dependency
import { 
  OuraApiResponse, 
  DailyActivity, 
  DailyReadiness, 
  DailySleep, 
  DailyStress, 
  SleepSession, 
  HeartRate, 
  EnhancedTag,
  TagApiResponse 
} from "./interfaces.js";

// Helper function to check if a string is a GUID/UUID
function isGuid(str: string): boolean {
  if (!str) return false;
  
  // GUID/UUID pattern: 8-4-4-4-12 hexadecimal digits
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidPattern.test(str);
}

/**
 * Service class for interacting with the Oura API
 */
export class OuraService {
  private token: string;
  private baseUrl: string = "https://api.ouraring.com/v2/usercollection";

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Makes a request to the Oura API
   * @param endpoint The API endpoint
   * @param params Query parameters
   * @returns Promise with the API response
   */
  private async fetchData<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<OuraApiResponse<T>> {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${this.token}`);

    // Build URL with query parameters
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
    };

    try {
      const response = await fetch(url.toString(), requestOptions);

      if (!response.ok) {
        throw new Error(
          `API request failed with status ${response.status}: ${await response.text()}`
        );
      }

      return (await response.json()) as OuraApiResponse<T>;
    } catch (error) {
      console.error("Error fetching data from Oura API:", error);
      throw error;
    }
  }

  /**
   * Get daily activity data
   */
  async getDailyActivity(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<DailyActivity>> {
    return this.fetchData<DailyActivity>("daily_activity", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get daily readiness data
   */
  async getDailyReadiness(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<DailyReadiness>> {
    return this.fetchData<DailyReadiness>("daily_readiness", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get daily sleep data
   */
  async getDailySleep(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<DailySleep>> {
    return this.fetchData<DailySleep>("daily_sleep", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get daily stress data
   */
  async getDailyStress(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<DailyStress>> {
    return this.fetchData<DailyStress>("daily_stress", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get heart rate data
   */
  async getHeartRate(
    startDateTime: string,
    endDateTime: string
  ): Promise<OuraApiResponse<HeartRate>> {
    return this.fetchData<HeartRate>("heartrate", {
      start_datetime: startDateTime,
      end_datetime: endDateTime,
    });
  }

  /**
   * Get enhanced tags
   */
  async getTags(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<EnhancedTag>> {
    return this.fetchData<EnhancedTag>("enhanced_tag", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Get sleep sessions
   */
  async getSleep(
    startDate: string,
    endDate: string
  ): Promise<OuraApiResponse<SleepSession>> {
    return this.fetchData<SleepSession>("sleep", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  /**
   * Check if the service can connect to the Oura API
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Check if we can access a simple endpoint
      await this.fetchData<any>("personal_info");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process tag data, filtering and enhancing with metadata
   */
  processTagData(
    tagsResult: OuraApiResponse<EnhancedTag>,
    tagName?: string
  ): TagApiResponse {
    // Convert to enhanced format
    const result = { ...tagsResult } as TagApiResponse;

    // Filter out custom tags (GUID) with empty comments
    if (result.data) {
      result.data = result.data.filter((tag: EnhancedTag) => {
        // Keep the tag if:
        // 1. It's a standard tag (tag_type_code is not a GUID), or
        // 2. It's a custom tag (tag_type_code is a GUID) but has a non-empty comment
        return (
          !isGuid(tag.tag_type_code) ||
          (isGuid(tag.tag_type_code) && tag.comment && tag.comment.trim() !== "")
        );
      });

      // Add metadata to help understand the tag structure
      result.tagMetadata = {
        standardTags: result.data.filter(
          (tag: EnhancedTag) => !isGuid(tag.tag_type_code)
        ).length,
        customTags: result.data.filter(
          (tag: EnhancedTag) => isGuid(tag.tag_type_code)
        ).length,
        note:
          "Custom tags (with GUID tag_type_code) represent user-defined entries, often containing meal information. Standard tags have descriptive tag_type_code values like 'tag_generic_supplements'.",
      };
    }

    // Filter by tag name if provided
    if (tagName && result.data) {
      result.data = result.data.filter(
        (tag: EnhancedTag) =>
          tag.custom_name?.toLowerCase().includes(tagName.toLowerCase()) ||
          tag.comment?.toLowerCase().includes(tagName.toLowerCase())
      );
    }

    return result;
  }
}

/**
 * Create an instance of the Oura service
 */
export function createOuraService(token: string): OuraService {
  return new OuraService(token);
}
