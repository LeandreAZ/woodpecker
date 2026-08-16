import { Component, type ReactNode } from 'react';
import './AppErrorBoundary.css';

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
        <main className="app-error-boundary">
          <div className="app-error-boundary__card">
            <h3>Cette page a rencontré une erreur.</h3>
            <p>Recharge la page. Si le problème revient, on corrigera la vue ou la donnée qui la fait tomber.</p>
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
