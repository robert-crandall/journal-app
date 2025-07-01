import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	
	// Environment variables configuration
	define: {
		'__APP_VERSION__': JSON.stringify(process.env.npm_package_version || '0.0.1'),
	},
	
	// Build optimization
	build: {
		target: 'es2022',
		sourcemap: false,
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte', '@sveltejs/kit'],
					ui: ['lucide-svelte']
				}
			}
		}
	},
	
	// Development server configuration
	server: {
		port: 5173,
		host: true,
		fs: {
			// Allow serving files from backend for type imports
			allow: ['..']
		}
	},
	
	// Optimize dependencies
	optimizeDeps: {
		include: ['lucide-svelte'],
		exclude: ['@sveltejs/kit', 'svelte']
	},
	
	test: {
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
