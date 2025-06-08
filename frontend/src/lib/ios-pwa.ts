// iOS-specific PWA utilities and enhancements
import { browser } from '$app/environment';

export interface IOSPWADetection {
	isIOS: boolean;
	isStandalone: boolean;
	version: string;
	canAddToHomeScreen: boolean;
}

export class IOSPWAManager {
	private detection: IOSPWADetection;

	constructor() {
		this.detection = this.detectIOSEnvironment();
		if (browser) {
			this.setupIOSEnhancements();
		}
	}

	private detectIOSEnvironment(): IOSPWADetection {
		// Return safe defaults if not in browser
		if (!browser) {
			return {
				isIOS: false,
				isStandalone: false,
				version: '',
				canAddToHomeScreen: false
			};
		}

		const userAgent = navigator.userAgent || '';
		const isIOS = /iPad|iPhone|iPod/.test(userAgent);
		const isStandalone =
			(window.navigator as any).standalone === true ||
			window.matchMedia('(display-mode: standalone)').matches;

		// Try to detect iOS version
		let version = '';
		if (isIOS) {
			const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
			if (match) {
				version = `${match[1]}.${match[2]}${match[3] ? '.' + match[3] : ''}`;
			}
		}

		return {
			isIOS,
			isStandalone,
			version,
			canAddToHomeScreen: isIOS && !isStandalone
		};
	}

	private setupIOSEnhancements(): void {
		if (!browser || !this.detection.isIOS) return;

		// Prevent zoom on double tap for better app-like experience
		this.preventDoubleTapZoom();

		// Handle safe area insets
		this.handleSafeAreaInsets();

		// Improve scrolling behavior
		this.improveScrolling();

		// Handle orientation changes
		this.handleOrientationChange();
	}

	private preventDoubleTapZoom(): void {
		if (!browser) return;
		let lastTouchEnd = 0;
		document.addEventListener(
			'touchend',
			(event) => {
				const now = new Date().getTime();
				if (now - lastTouchEnd <= 300) {
					event.preventDefault();
				}
				lastTouchEnd = now;
			},
			false
		);
	}

	private handleSafeAreaInsets(): void {
		if (!browser) return;

		// Add CSS custom properties for safe area insets
		const style = document.createElement('style');
		style.textContent = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top, 0px);
        --safe-area-inset-right: env(safe-area-inset-right, 0px);
        --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-inset-left: env(safe-area-inset-left, 0px);
      }
      
      body {
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
      }
      
      .ios-safe-area-top {
        padding-top: calc(var(--safe-area-inset-top) + 1rem);
      }
      
      .ios-safe-area-bottom {
        padding-bottom: calc(var(--safe-area-inset-bottom) + 1rem);
      }
    `;
		document.head.appendChild(style);
	}

	private improveScrolling(): void {
		if (!browser) return;

		// Add momentum scrolling for better iOS experience
		const style = document.createElement('style');
		style.textContent = `
      * {
        -webkit-overflow-scrolling: touch;
      }
      
      body {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: transparent;
      }
    `;
		document.head.appendChild(style);
	}

	private handleOrientationChange(): void {
		if (!browser) return;

		const handleOrientationChange = () => {
			// Force layout recalculation after orientation change
			setTimeout(() => {
				window.scrollTo(0, 0);
				// Trigger a resize event to help components adjust
				window.dispatchEvent(new Event('resize'));
			}, 100);
		};

		window.addEventListener('orientationchange', handleOrientationChange);

		// Also handle resize events that might indicate orientation change
		let resizeTimeout: number;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(handleOrientationChange, 100);
		});
	}

	public getDetection(): IOSPWADetection {
		return { ...this.detection };
	}

	public showAddToHomeScreenInstructions(): void {
		if (!this.detection.canAddToHomeScreen) return;

		// This could trigger a custom modal or toast with instructions
		console.log('To install this app on your iPhone/iPad:');
		console.log('1. Tap the Share button (square with arrow up)');
		console.log('2. Scroll down and tap "Add to Home Screen"');
		console.log('3. Tap "Add" in the top-right corner');
	}

	public isRunningAsApp(): boolean {
		return this.detection.isStandalone;
	}

	public canInstall(): boolean {
		return this.detection.canAddToHomeScreen;
	}
}

// Export singleton instance (only in browser)
export const iosPWAManager = browser ? new IOSPWAManager() : null;
