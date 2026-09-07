import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TrainingsPanelContentScreen from './TrainingsPanelContentScreen';

vi.mock('../../../solver/pages/SolverView', () => ({ default: ({ userSettingsOverview }: { userSettingsOverview?: { solverPreferences: { showCoordinates: boolean; showLegalMoves: boolean } } }) => <div data-testid="solver-preferences">{JSON.stringify(userSettingsOverview?.solverPreferences)}</div> }));

type Props = ComponentProps<typeof TrainingsPanelContentScreen>;
function props(enabled: boolean): Props {
  return {
    navigateToPuzzleSolver: vi.fn(), navigateToTraining: vi.fn(), navigateToView: vi.fn(),
    state: {
      activeView: 'solver', trainingsQuery: {}, recordAttemptMutation: {}, saveCyclePuzzleProgressMutation: {},
      cyclePuzzlesQuery: {}, trainingSummaryQuery: {}, trainingPuzzlesQuery: {},
      userSettingsOverviewQuery: { data: { solverPreferences: { showCoordinates: enabled, showLegalMoves: enabled } } },
    } as unknown as Props['state'],
  };
}
describe('Solver settings wiring', () => {
  it('transmet les préférences relues au solveur, y compris false et après retour', () => {
    const view = render(<TrainingsPanelContentScreen {...props(true)} />);
    expect(screen.getByTestId('solver-preferences')).toHaveTextContent('"showCoordinates":true,"showLegalMoves":true');
    view.rerender(<TrainingsPanelContentScreen {...props(false)} />);
    expect(screen.getByTestId('solver-preferences')).toHaveTextContent('"showCoordinates":false,"showLegalMoves":false');
    view.unmount();
    render(<TrainingsPanelContentScreen {...props(false)} />);
    expect(screen.getByTestId('solver-preferences')).toHaveTextContent('"showCoordinates":false,"showLegalMoves":false');
  });
});
