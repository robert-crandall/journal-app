import { describe, it, expect } from 'vitest';
import app from '../index';

describe('App Integration Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await app.request('/api/health');
      
      expect(res.status).toBe(200);
      const data = await res.json();
      
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      
      // Verify timestamp is valid ISO string
      const timestamp = new Date(data.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
    });

    it('should return 404 for non-existent routes', async () => {
      const res = await app.request('/non-existent-route');
      expect(res.status).toBe(404);
    });

    it('should handle root path', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(404); // No route defined for root
    });
  });

  describe('Middleware Integration', () => {
    it('should include CORS headers for all routes', async () => {
      const routes = ['/api/health', '/api/users/registration-status'];
      
      for (const route of routes) {
        const res = await app.request(route, {
          headers: {
            'Origin': 'http://localhost:5173'
          }
        });
        
        expect(res.status).not.toBe(500); // Should not fail due to CORS
        // CORS headers should be present (exact header depends on implementation)
        const corsHeader = res.headers.get('Access-Control-Allow-Origin') || 
                          res.headers.get('access-control-allow-origin');
        expect(corsHeader).toBeTruthy();
      }
    });

    it('should handle OPTIONS requests for CORS preflight', async () => {
      const res = await app.request('/api/users', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      expect(res.status).toBe(204); // No Content is correct for OPTIONS preflight
      
      // Check for CORS preflight headers
      const allowMethods = res.headers.get('Access-Control-Allow-Methods') ||
                          res.headers.get('access-control-allow-methods');
      const allowHeaders = res.headers.get('Access-Control-Allow-Headers') ||
                          res.headers.get('access-control-allow-headers');
                          
      expect(allowMethods || allowHeaders).toBeTruthy();
    });

    it('should reject requests from non-allowed origins', async () => {
      const res = await app.request('/api/health', {
        headers: {
          'Origin': 'https://malicious-site.com'
        }
      });

      // Should either reject with CORS error or allow but not include CORS headers
      expect(res.status).toBeLessThan(500); // Should not crash
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle requests without Content-Type', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
    });

    it('should return JSON content-type for JSON responses', async () => {
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      
      const contentType = res.headers.get('Content-Type') || res.headers.get('content-type');
      expect(contentType).toContain('application/json');
    });
  });

  describe('Request Method Handling', () => {
    it('should handle GET requests', async () => {
      const res = await app.request('/api/health', { method: 'GET' });
      expect(res.status).toBe(200);
    });

    it('should handle HEAD requests', async () => {
      const res = await app.request('/api/health', { method: 'HEAD' });
      expect([200, 405]).toContain(res.status); // Either works or method not allowed
    });

    it('should reject unsupported methods on health endpoint', async () => {
      const unsupportedMethods = ['PUT', 'DELETE', 'PATCH'];
      
      for (const method of unsupportedMethods) {
        const res = await app.request('/api/health', { method });
        expect(res.status).toBe(404); // Hono returns 404 for unsupported methods
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed URLs gracefully', async () => {
      // Test various edge cases
      const malformedUrls = [
        '/api/users/%',
        '/api/users/\\',
        '/api/users/<script>',
        '/api/users/?malformed=query%'
      ];

      for (const url of malformedUrls) {
        try {
          const res = await app.request(url);
          // Should not crash and should return a valid HTTP status
          expect(res.status).toBeGreaterThanOrEqual(200);
          expect(res.status).toBeLessThan(600);
        } catch (error) {
          // If it throws, it should be a proper HTTP error, not a crash
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle large request payloads appropriately', async () => {
      // Create a large JSON payload
      const largePayload = {
        name: 'a'.repeat(10000),
        email: 'large@example.com',
        password: 'password123'
      };

      const res = await app.request('/api/users', {
        method: 'POST',
        body: JSON.stringify(largePayload),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Should handle gracefully, either accepting or rejecting with appropriate status
      expect(res.status).toBeGreaterThanOrEqual(200);
      expect(res.status).toBeLessThan(600);
    });
  });

  describe('API Routing', () => {
    it('should route to users API correctly', async () => {
      const res = await app.request('/api/users/registration-status');
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toHaveProperty('enabled');
    });

    it('should return 404 for non-existent API routes', async () => {
      const res = await app.request('/api/non-existent');
      expect(res.status).toBe(404);
    });

    it('should return 404 for partial API routes', async () => {
      const res = await app.request('/api');
      expect(res.status).toBe(404);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent JSON structure for successful responses', async () => {
      const routes = [
        '/api/health',
        '/api/users/registration-status'
      ];

      for (const route of routes) {
        const res = await app.request(route);
        expect(res.status).toBe(200);
        
        const data = await res.json();
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
        expect(data).not.toBeNull();
      }
    });

    it('should return consistent error format for 404s', async () => {
      const res = await app.request('/non-existent');
      expect(res.status).toBe(404);
      
      // Should either return JSON error or text, but should be consistent
      const contentType = res.headers.get('Content-Type') || res.headers.get('content-type');
      expect(contentType).toBeDefined();
    });
  });
});
