import axios from 'axios';

interface PerplexitySearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface PerplexitySearchResponse {
  query: string;
  results: PerplexitySearchResult[];
  message?: string;
  error?: string;
}

// OpenAI-compatible message format
interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// OpenAI-compatible chat completion response
interface PerplexityChatCompletion {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class PerplexityClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.perplexity.ai';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search the web using Perplexity's chat/completions API
   * @param query Search query
   * @returns Search results
   */
  async search(query: string): Promise<PerplexitySearchResponse> {
    try {
      // Using the correct chat/completions endpoint with OpenAI-compatible format
      const response = await axios.post<PerplexityChatCompletion>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'sonar-pro', // Using Sonar model which has web search capabilities
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that searches the web to find relevant information. Return your response as a JSON array of search results with each item having title, url, and snippet properties.'
            },
            {
              role: 'user',
              content: `Search for information about: ${query}`
            }
          ],
          temperature: 0.3, // Lower temperature for more focused search results
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the assistant's response content
      const content = response.data.choices[0]?.message?.content || '';
      
      // Try to parse the JSON results from the content
      let results: PerplexitySearchResult[] = [];
      try {
        // The model should return JSON, but we'll handle cases where it doesn't
        results = this.extractSearchResults(content);
      } catch (parseError) {
        console.error('Failed to parse search results:', parseError);
        // Create a single result with the full content as a fallback
        results = [{
          title: `Search results for: ${query}`,
          url: '',
          snippet: content
        }];
      }

      return {
        query,
        results
      };
    } catch (error: any) {
      console.error('Perplexity search error:', error.message);
      
      // Return a formatted error response
      return {
        query,
        results: [],
        error: error.response?.data?.error || error.message,
        message: 'Failed to search with Perplexity API'
      };
    }
  }
  
  /**
   * Extract search results from the model's response
   * @param content The model's response content
   * @returns Parsed search results
   */
  private extractSearchResults(content: string): PerplexitySearchResult[] {
    // Try to find and parse JSON in the response
    const jsonMatch = content.match(/\[\s*{.*}\s*\]/s);
    
    if (jsonMatch) {
      try {
        const results = JSON.parse(jsonMatch[0]);
        if (Array.isArray(results)) {
          return results.map(item => ({
            title: item.title || 'No title',
            url: item.url || '',
            snippet: item.snippet || item.content || ''
          }));
        }
      } catch (e) {
        console.error('JSON parsing error:', e);
      }
    }
    
    // If we can't parse JSON, create a simple result with the content
    return [{
      title: 'Search Result',
      url: '',
      snippet: content
    }];
  }

  /**
   * Ask a question and get an answer using the Perplexity chat/completions API
   * @param query The question to ask
   * @returns Answer with sources
   */
  async ask(query: string): Promise<any> {
    try {
      const response = await axios.post<PerplexityChatCompletion>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'sonar-pro', // Using Sonar model which has web search capabilities
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that answers questions with accurate information from the web. Include sources for your information when possible.'
            },
            {
              role: 'user',
              content: query
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Extract the assistant's response
      const content = response.data.choices[0]?.message?.content || '';
      
      // Extract sources if they're in the response
      const sources = this.extractSources(content);

      return {
        query,
        answer: content,
        sources
      };
    } catch (error: any) {
      console.error('Perplexity ask error:', error.message);
      return {
        query,
        answer: null,
        error: error.response?.data?.error || error.message,
        message: 'Failed to get answer from Perplexity API'
      };
    }
  }
  
  /**
   * Extract sources from the model's response
   * @param content The model's response content
   * @returns Array of sources
   */
  private extractSources(content: string): Array<{title: string, url: string}> {
    // Common patterns for sources in AI model responses
    const sources: Array<{title: string, url: string}> = [];
    
    // Look for URLs in the content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = content.match(urlRegex);
    
    if (urls) {
      urls.forEach(url => {
        sources.push({
          title: this.extractDomainFromUrl(url),
          url: url
        });
      });
    }
    
    // Look for source sections
    const sourceSection = content.match(/Sources?:([\s\S]*?)(?:(?:\n\n)|$)/i);
    if (sourceSection) {
      const sourceLines = sourceSection[1].split('\n').filter(line => line.trim());
      sourceLines.forEach(line => {
        // Try to extract URL and title from line
        const urlInLine = line.match(/(https?:\/\/[^\s]+)/);        
        if (urlInLine) {
          const url = urlInLine[1];
          // Get title by removing the URL and common prefixes
          let title = line.replace(url, '').trim()
            .replace(/^[-\d.\[\]]+\s*/,'') // Remove leading numbers, dots, brackets
            .replace(/^"(.*)"$/, '$1'); // Remove quotes
          
          if (!title) title = this.extractDomainFromUrl(url);
          
          sources.push({ title, url });
        }
      });
    }
    
    // Remove duplicates
    return sources.filter((source, index, self) => 
      index === self.findIndex(s => s.url === source.url)
    );
  }
  
  /**
   * Extract domain name from URL for display
   * @param url URL string
   * @returns Domain name
   */
  private extractDomainFromUrl(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  }
}

/**
 * Create a Perplexity client with the provided API key
 * @param apiKey Perplexity API key
 * @returns Perplexity client instance
 */
export function createPerplexityClient(apiKey: string): PerplexityClient {
  return new PerplexityClient(apiKey);
}
