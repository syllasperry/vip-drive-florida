
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
