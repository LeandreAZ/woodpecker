import { type ReactNode } from 'react';
import { ChevronRight, Info } from 'lucide-react';
import type { DetailStat } from '../../types/detail.types';
import type { AttemptCard } from '../../types/detail.types';

export function DetailStatGrid({ stats }: { stats: DetailStat[] }) {
  return (
    <section className="wp-detail-stats" aria-label="Statistiques de l'entraînement">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <article key={stat.label} className={`wp-detail-stat-card is-${stat.tone}`}>
            <div className="wp-detail-stat-card__icon">
              <Icon aria-hidden="true" size={18} strokeWidth={2} />
            </div>
            <div className="wp-detail-stat-card__label">{stat.label}</div>
            <strong className="wp-detail-stat-card__value">{stat.value}</strong>
          </article>
        );
      })}
    </section>
  );
}

export function DetailRecentAttempts({ attempts, onViewAll }: { attempts: AttemptCard[]; onViewAll: () => void; }) {
  return (
    <section className="wp-panel wp-detail-section wp-detail-side-section">
      <div className="wp-detail-section__header">
        <div>
          <h2>Dernières tentatives</h2>
        </div>
        {attempts.length > 0 ? <button className="wp-detail-section__link" type="button" onClick={onViewAll}>Voir tout</button> : null}
      </div>

      {attempts.length === 0 ? (
        <p className="wp-empty">Aucune tentative sauvegardée pour le moment.</p>
      ) : (
        <div className="wp-detail-side-list">
          {attempts.map((attempt) => {
            const Icon = attempt.icon;
            return (
              <article key={attempt.id} className="wp-detail-side-row wp-detail-side-row--attempt">
                <span className={`wp-detail-side-row__status is-${attempt.accent}`}>
                  <Icon aria-hidden="true" size={14} strokeWidth={2} />
                </span>
                <div className="wp-detail-side-row__copy">
                  <strong>{attempt.title}</strong>
                  <small>{attempt.subtitle}</small>
                </div>
                <span className="wp-detail-side-row__timestamp">{attempt.timestamp}</span>
                <ChevronRight aria-hidden="true" className="wp-detail-side-row__arrow" size={16} strokeWidth={2} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DetailInfoBanner({ children }: { children: ReactNode }) {
  return (
    <section className="wp-panel wp-detail-info-banner">
      <span className="wp-detail-info-banner__icon">
        <Info aria-hidden="true" size={18} strokeWidth={2} />
      </span>
      <div>{children}</div>
    </section>
  );
}

