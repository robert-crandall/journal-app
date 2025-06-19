# Versioning for Static Builds

## Overview

The application now uses an improved versioning system for static builds that provides deterministic version identifiers based on git commit hashes while maintaining automatic update detection.

## How It Works

### Version Generation Strategy

1. **Environment Variable Override**: If `APP_VERSION` is set, it takes precedence
2. **Git-based Versioning**: Uses git commit hash for deterministic versioning
3. **Fallback**: Falls back to timestamp if git is not available

### Version Formats

#### Production Mode (`NODE_ENV=production`)
- Clean repository: `abc1234` (git commit hash)
- Dirty repository: `abc1234-dirty` (git commit hash with dirty flag)
- No git: `1750305141309` (timestamp)

#### Development Mode (default)
- With git: `abc1234-dev-1750305141309` (git commit hash + timestamp)
- No git: `dev-1750305141309` (timestamp)

#### Custom Version
- Set `APP_VERSION=v1.2.3` to override with custom version

## Benefits

1. **Deterministic**: Same code produces same version in production
2. **Efficient**: Only cache invalidation when code actually changes
3. **Flexible**: Supports custom versioning via environment variables
4. **Robust**: Graceful fallback when git is not available

## Usage Examples

### Build with Git
```bash
npm run build
# Uses git commit hash: abc1234 or abc1234-dirty
```

### Build with Custom Version
```bash
APP_VERSION=v1.0.0 npm run build
# Uses custom version: v1.0.0
```

### CI/CD Integration
```yaml
- name: Build with version
  env:
    APP_VERSION: ${{ github.sha }}
  run: npm run build
```

## Implementation Details

The versioning logic is implemented in `svelte.config.js` using the `generateVersion()` function which:

1. Checks for `APP_VERSION` environment variable
2. Attempts to run git commands to get commit hash and status
3. Falls back to timestamp if git commands fail
4. Formats version differently for development vs production

The version is used by:
- SvelteKit's built-in update detection system
- Service worker for cache management
- Automatic reload mechanism in the layout