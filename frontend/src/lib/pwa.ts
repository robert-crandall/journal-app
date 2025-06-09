// PWA utilities for detection and management
import { browser } from '$app/environment';
import { iosPWAManager } from './ios-pwa';

/**
 * Check if the app is running as a PWA
 */
export function isPWA(): boolean {
	if (!browser) return false;
	
	// Check if running in standalone mode (iOS/Android)
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		(window.navigator as any).standalone === true ||
		document.referrer.includes('android-app://') ||
		(iosPWAManager?.isRunningAsApp() ?? false)
	);
}

/**
 * Get PWA installation status and capabilities
 */
export function getPWAInfo() {
	return {
		isInstalled: isPWA(),
		canInstall: browser && 'serviceWorker' in navigator,
		supportsNotifications: browser && 'Notification' in window
	};
}
