// Test client for the Journal App API
// This demonstrates how to interact with the Hono backend APIs

const API_BASE_URL = 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface UserContext {
  id: string;
  key: string;
  values: string[];
  createdAt: string;
  updatedAt: string;
}

interface UserPreferences {
  theme: string;
  accentColor: string;
  timezone: string;
}

class JournalApiClient {
  private token: string | null = null;

  // Set authentication token
  setToken(token: string) {
    this.token = token;
  }

  // Clear authentication token
  clearToken() {
    this.token = null;
  }

  // Make authenticated request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  // Authentication methods
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return this.request('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // User profile methods
  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // User context methods
  async getContext(): Promise<ApiResponse<UserContext[]>> {
    return this.request<UserContext[]>('/auth/me/context');
  }

  async updateContext(contexts: {
    key: string;
    values: string[];
  }[]): Promise<ApiResponse<UserContext[]>> {
    return this.request<UserContext[]>('/auth/me/context', {
      method: 'PUT',
      body: JSON.stringify({ contexts }),
    });
  }

  // User preferences methods
  async getPreferences(): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>('/auth/me/preferences');
  }

  async updatePreferences(preferences: {
    theme?: string;
    accentColor?: string;
    timezone?: string;
  }): Promise<ApiResponse<UserPreferences>> {
    return this.request<UserPreferences>('/auth/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }
}

// Example usage and testing functions
async function runTests() {
  const client = new JournalApiClient();
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  console.log('🚀 Starting API Tests...\n');

  try {
    // Test registration
    console.log('📝 Testing user registration...');
    const registerResult = await client.register({
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
    });

    if (!registerResult.success) {
      console.error('❌ Registration failed:', registerResult.error);
      return;
    }

    console.log('✅ Registration successful');
    console.log('User:', registerResult.data?.user);
    
    // Set token for authenticated requests
    if (registerResult.data?.token) {
      client.setToken(registerResult.data.token);
    }

    // Test profile retrieval
    console.log('\n👤 Testing profile retrieval...');
    const profileResult = await client.getProfile();
    
    if (profileResult.success) {
      console.log('✅ Profile retrieved successfully');
      console.log('Profile:', profileResult.data);
    } else {
      console.error('❌ Profile retrieval failed:', profileResult.error);
    }

    // Test context update
    console.log('\n📋 Testing user context update...');
    const contextResult = await client.updateContext([
      {
        key: 'About me',
        values: ['I am a software engineer', 'I love coding', 'I want to improve my life'],
      },
      {
        key: 'Goals',
        values: ['Learn new skills', 'Exercise regularly', 'Read more books'],
      },
    ]);

    if (contextResult.success) {
      console.log('✅ Context updated successfully');
      console.log('Context:', contextResult.data);
    } else {
      console.error('❌ Context update failed:', contextResult.error);
    }

    // Test preferences update
    console.log('\n🎨 Testing preferences update...');
    const preferencesResult = await client.updatePreferences({
      theme: 'dark',
      accentColor: 'purple',
      timezone: 'America/New_York',
    });

    if (preferencesResult.success) {
      console.log('✅ Preferences updated successfully');
      console.log('Preferences:', preferencesResult.data);
    } else {
      console.error('❌ Preferences update failed:', preferencesResult.error);
    }

    // Test login with the created user
    console.log('\n🔐 Testing user login...');
    client.clearToken(); // Clear token to test login
    
    const loginResult = await client.login({
      email: testEmail,
      password: testPassword,
    });

    if (loginResult.success) {
      console.log('✅ Login successful');
      console.log('Token received:', !!loginResult.data?.token);
    } else {
      console.error('❌ Login failed:', loginResult.error);
    }

    // Test password reset request
    console.log('\n🔄 Testing password reset request...');
    const resetRequestResult = await client.requestPasswordReset(testEmail);
    
    if (resetRequestResult.success) {
      console.log('✅ Password reset request successful');
      console.log('Message:', resetRequestResult.message);
    } else {
      console.error('❌ Password reset request failed:', resetRequestResult.error);
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Export the client for use in other applications
export { JournalApiClient };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js environment
  runTests();
}
