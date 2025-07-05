import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Basic health check - you can add more sophisticated checks here
	// such as database connectivity, external service availability, etc.

	const healthCheck = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: process.env.NODE_ENV || 'development',
		buildTime: process.env.BUILD_TIME || 'unknown'
	};

	try {
		// You can add database connectivity check here if needed
		// Example:
		// await db.select().from(users).limit(1);

		return json(healthCheck, { status: 200 });
	} catch (error) {
		return json(
			{
				status: 'unhealthy',
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 503 }
		);
	}
};
