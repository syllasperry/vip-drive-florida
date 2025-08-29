
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ErrorBoundary } from './components/system/ErrorBoundary'

// Handlers globais de erro para capturar erros não tratados
window.onerror = (msg, url, line, col, err) => { 
  console.error('[window.onerror]', msg, url, line, col, err); 
};

window.onunhandledrejection = (ev) => { 
  console.error('[unhandledrejection]', ev.reason); 
  
  // Se for erro do Supabase, não rejeitar a promise para evitar crash
  if (ev.reason?.message?.includes('supabase') || ev.reason?.message?.includes('RLS')) {
    console.warn('[unhandledrejection] Erro do Supabase capturado e ignorado para evitar crash');
    ev.preventDefault();
  }
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('VIP Service Worker registered successfully:', registration.scope);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available, prompt user to refresh
                console.log('New service worker available');
                // Auto-activate new service worker
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
        
        // Listen for service worker controller changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed, reloading page');
          window.location.reload();
        });
      })
      .catch((error) => {
        console.log('VIP Service Worker registration failed:', error);
      });
  });
} else {
  console.log('Service workers are not supported in this browser');
}
