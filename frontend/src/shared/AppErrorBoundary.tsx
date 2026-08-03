import { Component, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="wp-page" style={{ padding: '28px' }}>
          <div className="wp-empty-card">
            <h3>Cette page a rencontre une erreur.</h3>
            <p>Recharge la page. Si le probleme revient, on corrigera la vue ou la donnee qui la fait tomber.</p>
            <button className="wp-primary" type="button" onClick={() => window.location.reload()}>
              Recharger
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
