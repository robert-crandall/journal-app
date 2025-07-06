/**
 * Build information utilities
 *
 * This module provides access to build-time information like
 * build timestamp and git commit hash for debugging and monitoring.
 */

export interface BuildInfo {
  buildTime: string | null;
  gitCommit: string | null;
  version: string | null;
}

/**
 * Get build information from environment variables
 */
export function getBuildInfo(): BuildInfo {
  return {
    buildTime: process.env.BUILD_TIME || null,
    gitCommit: process.env.GIT_COMMIT || null,
    version: process.env.GIT_COMMIT || process.env.npm_package_version || null,
  };
}

/**
 * Format build time as a human-readable string
 */
export function formatBuildTime(buildTime: string | null): string {
  if (!buildTime) {
    return 'Unknown';
  }

  try {
    const date = new Date(buildTime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return buildTime;
  }
}

/**
 * Get short git commit hash (first 7 characters)
 */
export function getShortCommit(gitCommit: string | null): string {
  if (!gitCommit) {
    return 'unknown';
  }
  return gitCommit.substring(0, 7);
}

/**
 * Check if we're running in a container
 */
export function isRunningInContainer(): boolean {
  return process.env.BUILD_TIME !== undefined || process.env.GIT_COMMIT !== undefined;
}
