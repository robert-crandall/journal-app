import { dev } from '$app/environment';

// This ensures we register the service worker properly in dev mode vs production
export const handleServiceWorkerRegistration = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js', {
        type: dev ? 'module' : 'classic',
      })
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  }
};
