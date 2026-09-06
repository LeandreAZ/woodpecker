import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { Notifications } from './components/ui/Notifications';
import { AppErrorBoundary } from './shared/AppErrorBoundary';
import './styles.css';
import './components/navigation/app-navigation.css';
import './features/trainings/layout/trainings-shell.css';
import './styles/components/ui-consistency.css';

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

