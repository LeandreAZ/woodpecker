import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './app/App';
import { Notifications } from './shared/ui/Notifications';
import { AppErrorBoundary } from './app/errors/AppErrorBoundary';
import './styles/globals.css';
import './app/layout/navigation/app-navigation.css';
import './app/layout/trainings/trainings-shell.css';
import './shared/ui/styles/ui-consistency.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Notifications />
        <App />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>,
);

