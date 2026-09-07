import {
  ChartNoAxesCombined,
  FileSpreadsheet,
  Layers3,
  Link,
} from 'lucide-react';
import { OFFICIAL_WOODPECKER_LOGO } from '../../../app/config/brand';
import { AuthPanel } from './AuthPanel';
import type { AuthSession } from '../services/authStorage';
import '../styles/auth.css';

type AuthScreenProps = {
  onAuthenticated: (session: AuthSession) => void;
  sessionMessage?: string | null;
};

type FeatureItem = {
  description: string;
  icon: typeof Layers3;
  title: string;
};

const featureItems: FeatureItem[] = [
  {
    icon: Layers3,
    title: 'Entraînements structurés',
    description: 'Organisez vos positions et répétez-les selon un parcours d’entraînement clair.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Statistiques de progression',
    description: 'Suivez vos performances et identifiez les domaines à améliorer.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Import CSV',
    description: 'Importez rapidement vos positions et construisez vos propres séries d’exercices.',
  },
  {
    icon: Link,
    title: 'Intégration Lichess',
    description: 'Retrouvez un flux de travail connecté à votre pratique sur Lichess.',
  },
];

function AuthScreen({ onAuthenticated, sessionMessage }: AuthScreenProps) {
  return (
    <main className="auth-page">
      <div className="auth-page__layout">
        <section className="auth-page__brand" aria-label="Présentation de Woodpecker Trainer">
          <div className="auth-page__brand-stack">
            <img alt="Woodpecker Trainer" className="auth-page__logo" src={OFFICIAL_WOODPECKER_LOGO} />

            <div className="auth-page__hero">
              <h2 className="auth-page__title">
                Entraînez-vous
                <br />
                avec <span>méthode.</span>
              </h2>
              <p className="auth-page__description">
                Organisez vos positions, répétez efficacement et suivez votre progression dans un espace pensé pour structurer votre entraînement aux échecs.
              </p>
            </div>

            <div className="auth-page__features" aria-label="Fonctionnalités principales">
              {featureItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article key={item.title} className="auth-page__feature">
                    <div className="auth-page__feature-icon-wrap">
                      <Icon aria-hidden="true" className="auth-page__feature-icon" size={28} strokeWidth={1.9} />
                    </div>
                    <div className="auth-page__feature-copy">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="auth-page__auth" aria-label="Authentification">
          <div className="auth-page__auth-inner">
            <div className="auth-page__mobile-brand">
              <img alt="Woodpecker Trainer" className="auth-page__mobile-logo" src={OFFICIAL_WOODPECKER_LOGO} />
              <div className="auth-page__mobile-copy">
                <h2>Entraînez-vous avec méthode.</h2>
                <p>Connectez-vous ou créez votre compte pour retrouver vos entraînements.</p>
              </div>
            </div>
            <AuthPanel onAuthenticated={onAuthenticated} sessionMessage={sessionMessage} />
          </div>
        </section>
      </div>
    </main>
  );
}

export type { AuthScreenProps };
export { AuthScreen };
export default AuthScreen;