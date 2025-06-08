// PWA utilities for service worker registration and management
import { iosPWAManager } from './ios-pwa';

class PWAManager {
  constructor() {
    this.init();
  }

  private async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await this.registerServiceWorker();
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private async registerServiceWorker(): Promise<void> {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration);

    // Handle updates - automatically update without user intervention
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Automatically update - no user notification
            this.handleServiceWorkerUpdate(newWorker);
          }
        });
      }
    });
  }

  private handleServiceWorkerUpdate(worker: ServiceWorker): void {
    // Silently activate the new version
    worker.postMessage({ type: 'SKIP_WAITING' });
    
    // Automatically reload the page after a short delay to apply updates
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  public isPWAInstalled(): boolean {
    // Check if running in standalone mode (iOS/Android)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://') ||
           (iosPWAManager?.isRunningAsApp() ?? false);
  }
}

// Export singleton instance
export const pwaManager = new PWAManager();

// Utility functions for PWA detection
export const isPWA = () => pwaManager.isPWAInstalled();
