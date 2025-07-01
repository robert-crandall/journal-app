import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../db/connection'
import { sql } from 'drizzle-orm'

const app = new Hono()

// SQL execution endpoint for testing - only enable in development/test environments
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  
  const sqlExecutionSchema = z.object({
    query: z.string(),
    params: z.array(z.any()).optional().default([])
  })

  app.post('/execute-sql',
    zValidator('json', sqlExecutionSchema),
    async (c) => {
      try {
        const { query, params } = c.req.valid('json')
        
        console.log('Executing SQL query:', query)
        console.log('With params:', params)
        
        // Execute the raw SQL query
        let result;
        if (params && params.length > 0) {
          // Use placeholder replacement for parameterized queries
          let parameterizedQuery = query;
          params.forEach((param, index) => {
            parameterizedQuery = parameterizedQuery.replace(`$${index + 1}`, 
              typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param);
          });
          result = await db.execute(sql.raw(parameterizedQuery));
        } else {
          result = await db.execute(sql.raw(query));
        }
        
        return c.json({
          success: true,
          rows: result,
          rowCount: Array.isArray(result) ? result.length : 0
        })
        
      } catch (error) {
        console.error('SQL execution error:', error)
        return c.json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
      }
    }
  )

} else {
  // In production, this endpoint is disabled
  app.post('/execute-sql', (c) => {
    return c.json({
      success: false,
      error: 'SQL execution endpoint is disabled in production'
    }, 403)
  })
}

export default app
