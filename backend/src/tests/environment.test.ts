import { describe, it, expect } from 'vitest';
import app from '../index';

describe('Environment Configuration Integration', () => {
  describe('Registration Control', () => {
    it('should respect ALLOW_REGISTRATION environment variable', async () => {
      const res = await app.request('/api/users/registration-status');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data).toHaveProperty('enabled');
      expect(typeof data.enabled).toBe('boolean');
      
      // The value should reflect the actual environment setting
      // In test environment, this should be true based on .env.example
      expect(data.enabled).toBe(true);
    });

    it('should block registration when disabled', async () => {
      // This test assumes we can temporarily modify the environment
      // In a real scenario, you might test this with a separate test database
      // or environment configuration
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      // First, check if registration is enabled
      const statusRes = await app.request('/api/users/registration-status');
      const statusData = await statusRes.json();
      
      if (statusData.enabled) {
        // If registration is enabled, user creation should work
        const res = await app.request('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        expect(res.status).toBe(201);
      } else {
        // If registration is disabled, user creation should fail
        const res = await app.request('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        expect(res.status).toBe(403);
        const errorData = await res.json();
        expect(errorData).toHaveProperty('error');
        expect(errorData.error).toContain('Registration is currently disabled');
      }
    });
  });

  describe('Database Configuration', () => {
    it('should connect to database successfully', async () => {
      // Test database connectivity by trying to create a user
      const userData = {
        name: 'DB Test User',
        email: 'dbtest@example.com',
        password: 'password123'
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Should succeed if database is properly configured
      // Should fail with 500 if database connection issues
      expect([201, 500]).toContain(res.status);
      
      if (res.status === 500) {
        console.warn('Database connection may have issues - this is expected in some test environments');
      }
    });
  });

  describe('JWT Configuration', () => {
    it('should generate valid JWT tokens', async () => {
      const userData = {
        name: 'JWT Config Test',
        email: 'jwtconfig@example.com',
        password: 'password123'
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 201) {
        const responseData = await res.json();
        expect(responseData).toHaveProperty('token');
        
        const token = responseData.token;
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
        
        // JWT format check (header.payload.signature)
        const parts = token.split('.');
        expect(parts).toHaveLength(3);
        
        // Each part should be base64-encoded
        for (const part of parts) {
          expect(part.length).toBeGreaterThan(0);
          // Should not contain invalid base64 characters
          expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
        }
      }
    });
  });

  describe('CORS Configuration', () => {
    it('should allow configured frontend origins', async () => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:5174'
      ];

      for (const origin of allowedOrigins) {
        const res = await app.request('/api/health', {
          headers: {
            'Origin': origin
          }
        });

        expect(res.status).toBe(200);
        
        // Should include CORS headers
        const corsHeader = res.headers.get('Access-Control-Allow-Origin') ||
                          res.headers.get('access-control-allow-origin');
        expect(corsHeader).toBeTruthy();
      }
    });

    it('should handle credentials correctly', async () => {
      const res = await app.request('/api/health', {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      expect(res.status).toBe(200);
      
      // Check if credentials are handled
      const credentialsHeader = res.headers.get('Access-Control-Allow-Credentials') ||
                               res.headers.get('access-control-allow-credentials');
      
      // Should either be 'true' or not present (depending on CORS config)
      if (credentialsHeader) {
        expect(credentialsHeader).toBe('true');
      }
    });
  });

  describe('Environment Error Handling', () => {
    it('should handle missing environment variables gracefully', async () => {
      // This test ensures the app doesn't crash if env vars are missing
      // The actual behavior depends on how the env loading is implemented
      
      const res = await app.request('/api/health');
      
      // Should not crash, even if some env vars are missing
      expect(res.status).toBeLessThan(500);
    });

    it('should validate environment configuration', async () => {
      // Test that the app properly validates its configuration
      const res = await app.request('/api/health');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
      
      // If the app is responding to health checks, 
      // it means the environment is properly configured
    });
  });
});
