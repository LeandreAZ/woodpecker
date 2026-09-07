import { Component, type ReactNode } from 'react';
import './AppErrorBoundary.css';
import { StatePanel } from '../../shared/ui/StatePanel';

type AppErrorBoundaryProps = {
  children: ReactNode;
  onBack?: () => void;
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
        <StatePanel kind="api" title="Cette page a rencontré une erreur" description="Le contenu n’a pas pu être affiché. Vous pouvez recharger la page ou revenir à vos entraînements." onRetry={() => window.location.reload()} onBack={this.props.onBack ?? (() => window.location.assign('/'))} />
      );
    }

    return this.props.children;
  }
}
