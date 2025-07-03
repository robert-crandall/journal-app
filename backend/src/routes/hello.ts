import { Hono } from 'hono';
import { jwtAuth, getUserId } from '../middleware/auth';
import { HTTPException } from 'hono/http-exception';
import { handleApiError } from '../utils/logger';

// Chain methods for RPC compatibility
const app = new Hono()
  // Protected hello world endpoint requiring authentication
  .get('/', jwtAuth, async (c) => {
    try {
      // Get user ID from JWT context (set by jwtAuth middleware)
      const userId = getUserId(c);
      const jwtPayload = c.get('jwtPayload');
      
      return c.json({
        message: `Hello, ${jwtPayload.email}!`,
        id: userId, // Send as id instead of userId
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle error using standard pattern
      handleApiError(error, 'Failed to fetch hello message');
    }
  });

export default app;
