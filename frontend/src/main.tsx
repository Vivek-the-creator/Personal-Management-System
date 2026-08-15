import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts';
import { AuthProvider } from '@/providers/AuthProvider';
import { queryClient } from '@/lib/query-client';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/*
          Provider order rationale:
          - QueryClientProvider: outermost — everything needs data fetching
          - ThemeProvider: second — needs to apply theme before paint
          - AuthProvider: third — runs SessionHydrator on mount to silently restore session
          - App: innermost — contains RouterProviderWrapper which creates the router
        */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
