import { zValidator } from '@hono/zod-validator';

/**
 * Standard error handler for zValidator that preserves Zod v4 error format
 * Ensures validation errors are returned in the expected format with issues array
 */
export const zodValidatorWithErrorHandler = (target: 'json' | 'query' | 'param', schema: any) => 
  zValidator(target, schema as any, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        error: { issues: result.error.issues }
      }, 400);
    }
  });