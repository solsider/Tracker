import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

// Global unhandled error/rejection crash reporter
function sendCrash(message: string, stack?: string) {
  try {
    navigator.sendBeacon(
      '/api/telemetry/crash',
      JSON.stringify({ message: message.slice(0, 500), stack: stack?.slice(0, 5000), url: location.href.slice(0, 200) }),
    );
  } catch { /* never throw */ }
}
window.addEventListener('error', (e) => sendCrash(e.message, e.error?.stack));
window.addEventListener('unhandledrejection', (e) => sendCrash(String(e.reason), e.reason?.stack));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
