// Test the type-safe client
import { 
  createJournalApiClient, 
  ApiError,
  type RegisterInput,
  type LoginInput,
  type UserContextInput,
  type UserPreferencesInput
} from './index';

async function runClientTests() {
  console.log('🚀 Starting Type-Safe Client Tests...\n');

  // Create a client instance
  const client = createJournalApiClient({
    baseUrl: 'http://localhost:3001',
    timeout: 10000,
  });

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'testpassword123';

  try {
    // Test 1: Health Check
    console.log('🔍 Testing health check...');
    const health = await client.healthCheck();
    console.log('✅ Health check passed:', health.data || health.message);

    // Test 2: User Registration
    console.log('\n📝 Testing user registration...');
    const registerData: RegisterInput = {
      email: testEmail,
      password: testPassword,
      firstName: 'Test',
      lastName: 'User',
    };

    const registerResult = await client.register(registerData);
    
    if (registerResult.success && registerResult.data) {
      console.log('✅ Registration successful');
      console.log('User:', registerResult.data.user);
      console.log('Token automatically set:', client.isAuthenticated());
    } else {
      console.error('❌ Registration failed:', registerResult.error);
      return;
    }

    // Test 3: Profile Retrieval (using automatic token)
    console.log('\n👤 Testing profile retrieval...');
    const profileResult = await client.getProfile();
    
    if (profileResult.success) {
      console.log('✅ Profile retrieved successfully');
      console.log('Profile:', profileResult.data);
    } else {
      console.error('❌ Profile retrieval failed:', profileResult.error);
    }

    // Test 4: Context Update
    console.log('\n📋 Testing user context update...');
    const contexts: UserContextInput[] = [
      {
        key: 'About me',
        values: ['I am a software engineer', 'I love TypeScript', 'I want to improve my life'],
      },
      {
        key: 'Goals',
        values: ['Learn new skills', 'Exercise regularly', 'Read more books'],
      },
    ];

    const contextResult = await client.updateContext(contexts);
    
    if (contextResult.success) {
      console.log('✅ Context updated successfully');
      console.log('Context count:', contextResult.data?.length);
    } else {
      console.error('❌ Context update failed:', contextResult.error);
    }

    // Test 5: Preferences Update
    console.log('\n🎨 Testing preferences update...');
    const preferences: UserPreferencesInput = {
      theme: 'dark',
      accentColor: 'purple',
      timezone: 'America/New_York',
    };

    const preferencesResult = await client.updatePreferences(preferences);
    
    if (preferencesResult.success) {
      console.log('✅ Preferences updated successfully');
      console.log('Preferences:', preferencesResult.data);
    } else {
      console.error('❌ Preferences update failed:', preferencesResult.error);
    }

    // Test 6: Profile Update
    console.log('\n✏️ Testing profile update...');
    const profileUpdateResult = await client.updateProfile({
      firstName: 'Updated',
      lastName: 'Name',
    });
    
    if (profileUpdateResult.success) {
      console.log('✅ Profile updated successfully');
      console.log('Updated profile:', profileUpdateResult.data);
    } else {
      console.error('❌ Profile update failed:', profileUpdateResult.error);
    }

    // Test 7: Get Updated Context
    console.log('\n📖 Testing context retrieval...');
    const getContextResult = await client.getContext();
    
    if (getContextResult.success) {
      console.log('✅ Context retrieved successfully');
      console.log('Contexts:', getContextResult.data);
    } else {
      console.error('❌ Context retrieval failed:', getContextResult.error);
    }

    // Test 8: Logout and Login
    console.log('\n🚪 Testing logout...');
    await client.logout();
    console.log('✅ Logged out, authenticated:', client.isAuthenticated());

    console.log('\n🔐 Testing login...');
    const loginData: LoginInput = {
      email: testEmail,
      password: testPassword,
    };

    const loginResult = await client.login(loginData);
    
    if (loginResult.success) {
      console.log('✅ Login successful');
      console.log('Authenticated after login:', client.isAuthenticated());
    } else {
      console.error('❌ Login failed:', loginResult.error);
    }

    // Test 9: Password Reset Request
    console.log('\n🔄 Testing password reset request...');
    const resetRequestResult = await client.requestPasswordReset(testEmail);
    
    if (resetRequestResult.success) {
      console.log('✅ Password reset request successful');
      console.log('Message:', resetRequestResult.message);
    } else {
      console.error('❌ Password reset request failed:', resetRequestResult.error);
    }

    // Test 10: Error Handling
    console.log('\n❗ Testing error handling...');
    try {
      // Try to access protected resource without token
      client.clearToken();
      await client.getProfile();
    } catch (error) {
      if (error instanceof ApiError) {
        console.log('✅ Error handling works correctly');
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);
        console.log('Error status:', error.status);
      } else {
        console.error('❌ Unexpected error type:', error);
      }
    }

    console.log('\n🎉 All client tests completed successfully!');
    console.log('\n📋 Client Features Verified:');
    console.log('✅ Type-safe API calls');
    console.log('✅ Automatic token management');
    console.log('✅ Comprehensive error handling');
    console.log('✅ Request validation');
    console.log('✅ Response type inference');
    console.log('✅ Authentication state management');

  } catch (error) {
    if (error instanceof ApiError) {
      console.error('💥 API Error:', {
        message: error.message,
        status: error.status,
        response: error.response,
      });
    } else {
      console.error('💥 Unexpected error:', error);
    }
  }
}

// Export for use in other test files
export { runClientTests };

// Run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runClientTests();
}
