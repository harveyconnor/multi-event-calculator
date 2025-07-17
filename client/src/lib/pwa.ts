// PWA utilities for install prompt and offline handling

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  showInstallButton();
});

// Show install button when PWA is installable
function showInstallButton() {
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
  }
}

// Handle install button click
export function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

// Check if app is running in standalone mode
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
}

// Check if service worker is supported
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

// Check if app is online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Handle offline/online events
export function setupOnlineOfflineHandlers() {
  window.addEventListener('online', () => {
    console.log('App is online');
    // Sync any pending data
    syncPendingData();
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Show offline indicator
    showOfflineIndicator();
  });
}

// Show offline indicator
function showOfflineIndicator() {
  const offlineIndicator = document.getElementById('offline-indicator');
  if (offlineIndicator) {
    offlineIndicator.style.display = 'block';
  }
}

// Sync pending data when back online
async function syncPendingData() {
  // This would sync any performance data stored locally while offline
  const pendingData = localStorage.getItem('pending-performances');
  if (pendingData) {
    try {
      const performances = JSON.parse(pendingData);
      // Send to server when online
      for (const performance of performances) {
        await fetch('/api/performances', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(performance)
        });
      }
      localStorage.removeItem('pending-performances');
    } catch (error) {
      console.error('Error syncing pending data:', error);
    }
  }
}

// Store performance data for offline sync
export function storePerformanceOffline(performance: any) {
  const pendingData = localStorage.getItem('pending-performances');
  const performances = pendingData ? JSON.parse(pendingData) : [];
  performances.push(performance);
  localStorage.setItem('pending-performances', JSON.stringify(performances));
}