import { randomBytes } from 'crypto';

/**
 * OAuth 2.1 Authorization with PKCE support
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
  usePkce?: boolean;
}

/**
 * Token response from OAuth provider
 */
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
}

/**
 * Secure token storage and management
 */
export interface TokenStore {
  getToken(userId: string, provider: string): Promise<string | null>;
  saveToken(userId: string, provider: string, token: string, expiresIn?: number): Promise<void>;
  refreshToken(userId: string, provider: string): Promise<string | null>;
  revokeToken(userId: string, provider: string): Promise<void>;
}

/**
 * In-memory implementation of token store (for development only)
 * Production code should use a secure database or key vault
 */
export class InMemoryTokenStore implements TokenStore {
  private tokens: Record<string, { token: string, expiresAt?: Date }> = {};
  
  private getKey(userId: string, provider: string): string {
    return `${userId}:${provider}`;
  }
  
  async getToken(userId: string, provider: string): Promise<string | null> {
    const key = this.getKey(userId, provider);
    const entry = this.tokens[key];
    
    if (!entry) {
      return null;
    }
    
    // Check if token is expired
    if (entry.expiresAt && entry.expiresAt < new Date()) {
      return null;
    }
    
    return entry.token;
  }
  
  async saveToken(
    userId: string, 
    provider: string, 
    token: string, 
    expiresIn?: number
  ): Promise<void> {
    const key = this.getKey(userId, provider);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined;
    
    this.tokens[key] = { token, expiresAt };
  }
  
  async refreshToken(userId: string, provider: string): Promise<string | null> {
    // This is just a placeholder - actual implementation would use the refresh token
    // to obtain a new access token from the OAuth provider
    return null;
  }
  
  async revokeToken(userId: string, provider: string): Promise<void> {
    const key = this.getKey(userId, provider);
    delete this.tokens[key];
  }
}

/**
 * OAuth 2.1 authentication provider with PKCE support
 */
export class OAuthProvider {
  private config: OAuthConfig;
  private tokenStore: TokenStore;
  private codeVerifiers: Map<string, string> = new Map();
  
  constructor(config: OAuthConfig, tokenStore: TokenStore) {
    this.config = config;
    this.tokenStore = tokenStore;
  }
  
  /**
   * Generate a secure random string for PKCE
   */
  private generateCodeVerifier(): string {
    // Using crypto's randomBytes for secure random generation
    return randomBytes(32)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  /**
   * Create SHA256 code challenge from verifier (for PKCE)
   */
  private async createCodeChallenge(verifier: string): Promise<string> {
    // In a real implementation, this would use the Web Crypto API
    // to create a SHA-256 hash of the verifier
    // This is a placeholder implementation
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    
    // Convert to base64url encoding
    return hashBase64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  /**
   * Generate the authorization URL
   */
  async getAuthorizationUrl(state: string): Promise<{ url: string, codeVerifier?: string }> {
    const url = new URL(this.config.authorizationUrl);
    
    // Add required OAuth parameters
    url.searchParams.append('client_id', this.config.clientId);
    url.searchParams.append('redirect_uri', this.config.redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('state', state);
    url.searchParams.append('scope', this.config.scope.join(' '));
    
    // Add PKCE if enabled
    if (this.config.usePkce) {
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.createCodeChallenge(codeVerifier);
      
      url.searchParams.append('code_challenge', codeChallenge);
      url.searchParams.append('code_challenge_method', 'S256');
      
      // Store the code verifier for later use
      this.codeVerifiers.set(state, codeVerifier);
      
      return { url: url.toString(), codeVerifier };
    }
    
    return { url: url.toString() };
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    state: string,
    userId: string
  ): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', this.config.redirectUri);
    params.append('client_id', this.config.clientId);
    
    // Add client secret if available (for confidential clients)
    if (this.config.clientSecret) {
      params.append('client_secret', this.config.clientSecret);
    }
    
    // Add code verifier if PKCE was used
    if (this.config.usePkce) {
      const codeVerifier = this.codeVerifiers.get(state);
      if (!codeVerifier) {
        throw new Error('Code verifier not found for this state');
      }
      
      params.append('code_verifier', codeVerifier);
      this.codeVerifiers.delete(state); // Clean up after use
    }
    
    // Make token request
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
    }
    
    const tokenResponse = await response.json() as TokenResponse;
    
    // Store the access token
    await this.tokenStore.saveToken(
      userId,
      this.getProviderName(),
      tokenResponse.access_token,
      tokenResponse.expires_in
    );
    
    return tokenResponse;
  }
  
  /**
   * Get provider name derived from authorization URL
   */
  getProviderName(): string {
    try {
      const url = new URL(this.config.authorizationUrl);
      return url.hostname.split('.').slice(-2, -1)[0]; // Extract domain name
    } catch (e) {
      return 'unknown-provider';
    }
  }
  
  /**
   * Get access token for a user
   */
  async getAccessToken(userId: string): Promise<string | null> {
    const token = await this.tokenStore.getToken(userId, this.getProviderName());
    
    if (!token) {
      // Try to refresh the token
      return this.tokenStore.refreshToken(userId, this.getProviderName());
    }
    
    return token;
  }
}
