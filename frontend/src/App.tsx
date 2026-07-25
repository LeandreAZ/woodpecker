import { useQuery } from '@tanstack/react-query';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function fetchApiStatus(): Promise<string> {
  const response = await fetch(apiBaseUrl, {
    headers: {
      Accept: 'application/ld+json',
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  return response.status.toString();
}

export function App() {
  const apiStatus = useQuery({
    queryKey: ['api-status'],
    queryFn: fetchApiStatus,
    retry: 1,
  });

  return (
    <main className="app-shell">
      <section className="intro-panel">
        <p className="eyebrow">Woodpecker Trainer</p>
        <h1>Chess training, built cycle by cycle.</h1>
        <p className="lead">
          Frontend React, backend Symfony API Platform, PostgreSQL and Docker are now wired together.
        </p>
        <div className="status-row">
          <span className="status-label">API status</span>
          <span className={apiStatus.isSuccess ? 'status-pill status-ok' : 'status-pill'}>
            {apiStatus.isLoading && 'Checking'}
            {apiStatus.isError && 'Unavailable'}
            {apiStatus.isSuccess && `HTTP ${apiStatus.data}`}
          </span>
        </div>
      </section>
    </main>
  );
}
