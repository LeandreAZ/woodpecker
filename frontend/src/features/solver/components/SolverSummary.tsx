import { ChessPawn } from 'lucide-react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import type { SolverSideSummary, SolverStatusSummary } from '../types/solverView.types';
import { getAttemptSummaryLabel } from '../utils/solverFormatting';

export function SolverSummary({ statusSummary, persistedAttemptCount, sideSummary }: { statusSummary: SolverStatusSummary; persistedAttemptCount: number; sideSummary: SolverSideSummary }) {
  return (
    <div className="wp-solver-summary-v2">
      <div className={`wp-solver-summary-v2__item is-${statusSummary.accent}`}><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon">{statusSummary.accent === 'success' ? <AppIcons.CheckCircleIcon /> : statusSummary.accent === 'danger' ? <AppIcons.AlertIcon /> : <AppIcons.TargetIcon />}</span><span className="wp-solver-summary-v2__label">Résultat</span></div><div className="wp-solver-summary-v2__content"><strong>{statusSummary.label}</strong><p>{statusSummary.description}</p></div></div>
      <div className="wp-solver-summary-v2__item is-accent-blue"><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon"><AppIcons.HistoryIcon /></span><span className="wp-solver-summary-v2__label">Tentatives</span></div><div className="wp-solver-summary-v2__content"><p className="wp-solver-summary-v2__attempt-text">{getAttemptSummaryLabel(persistedAttemptCount)}</p></div></div>
      <div className="wp-solver-summary-v2__item is-accent-blue"><div className="wp-solver-summary-v2__head"><span className="wp-solver-summary-v2__icon"><ChessPawn size={20} strokeWidth={1.9} /></span><span className="wp-solver-summary-v2__label">Trait</span></div><div className="wp-solver-summary-v2__content"><strong>{sideSummary.label}</strong><p>{sideSummary.description}</p></div></div>
    </div>
  );
}
