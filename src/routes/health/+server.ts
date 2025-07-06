import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getBuildInfo, formatBuildTime, getShortCommit } from '$lib/server/build-info.js';

export const GET: RequestHandler = async () => {
  // Basic health check - you can add more sophisticated checks here
  // such as database connectivity, external service availability, etc.

  const buildInfo = getBuildInfo();

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    build: {
      time: buildInfo.buildTime,
      timeFormatted: formatBuildTime(buildInfo.buildTime),
      gitCommit: buildInfo.gitCommit,
      gitCommitShort: getShortCommit(buildInfo.gitCommit),
      version: buildInfo.version,
    },
  };

  try {
    // You can add database connectivity check here if needed
    // Journal:
    // await db.select().from(users).limit(1);

    return json(healthCheck, { status: 200 });
  } catch (error) {
    return json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        build: {
          time: buildInfo.buildTime,
          gitCommit: buildInfo.gitCommit,
          gitCommitShort: getShortCommit(buildInfo.gitCommit),
        },
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 },
    );
  }
};
