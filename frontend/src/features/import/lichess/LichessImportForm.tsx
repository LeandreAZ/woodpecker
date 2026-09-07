import { LoadingButton } from '../../../shared/ui/LoadingButton';
import type { useImportViewState } from '../hooks/useImportViewState';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { QUICK_PUZZLE_COUNTS } from './lichessThemes';
import { formatInteger } from '../utils/importFormatting';

type Props = Pick<
  ReturnType<typeof useImportViewState>,
  | 'isImportingLichess'
  | 'onImportLichess'
  | 'count'
  | 'setCount'
  | 'minRating'
  | 'setMinRating'
  | 'maxRating'
  | 'setMaxRating'
  | 'selectedThemes'
  | 'themeQuery'
  | 'setThemeQuery'
  | 'optionsError'
  | 'searchOptions'
  | 'distribution'
  | 'setDistribution'
  | 'minMoves'
  | 'setMinMoves'
  | 'maxMoves'
  | 'setMaxMoves'
  | 'themeDistribution'
  | 'setThemeDistribution'
  | 'availablePuzzleCount'
  | 'isLoadingAvailability'
  | 'filteredThemeOptions'
  | 'selectedThemeLabels'
  | 'countIsValid'
  | 'ratingsAreValid'
  | 'canImportIntoTraining'
  | 'parsedMinMoves'
  | 'parsedMaxMoves'
  | 'moveRangeIsValid'
  | 'customDistributionIsValid'
  | 'addTheme'
  | 'removeTheme'
>;

export function LichessImportForm({
  isImportingLichess,
  onImportLichess,
  count,
  setCount,
  minRating,
  setMinRating,
  maxRating,
  setMaxRating,
  selectedThemes,
  themeQuery,
  setThemeQuery,
  optionsError,
  searchOptions,
  distribution,
  setDistribution,
  minMoves,
  setMinMoves,
  maxMoves,
  setMaxMoves,
  themeDistribution,
  setThemeDistribution,
  availablePuzzleCount,
  isLoadingAvailability,
  filteredThemeOptions,
  selectedThemeLabels,
  countIsValid,
  ratingsAreValid,
  canImportIntoTraining,
  parsedMinMoves,
  parsedMaxMoves,
  moveRangeIsValid,
  customDistributionIsValid,
  addTheme,
  removeTheme,
}: Props) {
  return (
    <section aria-label="Génération Lichess" className="wp-import-grid" role="tabpanel">
      <div className="wp-import-configuration">
        <details className="wp-panel wp-import-step wp-import-step-card" open>
          <summary>
            <span>
              <h3>1. Nombre de puzzles</h3>
              <p>Définissez le nombre de puzzles à générer.</p>
            </span>
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <div className="wp-import-count-row">
            <div className="wp-import-count-control">
              <label>
                Nombre de puzzles
                <input
                  max="1000"
                  min="1"
                  onChange={(event) => setCount(Number(event.target.value))}
                  type="number"
                  value={count}
                />
              </label>
              <div className="wp-import-quick-counts">
                {QUICK_PUZZLE_COUNTS.map((preset) => (
                  <button
                    aria-pressed={count === preset}
                    className={count === preset ? 'is-active' : ''}
                    key={preset}
                    onClick={() => setCount(preset)}
                    type="button"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <p className="wp-import-availability">
              <strong>{availablePuzzleCount === null ? '—' : formatInteger(availablePuzzleCount)}</strong>
              <span>{isLoadingAvailability ? 'Mise à jour...' : 'puzzles disponibles'}</span>
            </p>
          </div>
          {!countIsValid ? (
            <p className="alert error-alert">Choisissez un nombre entier entre 1 et 1 000.</p>
          ) : null}
        </details>
        <details className="wp-panel wp-import-step wp-import-step-card" open>
          <summary>
            <span>
              <h3>2. Difficulté (rating Lichess)</h3>
              <p>Sélectionnez l’intervalle de difficulté.</p>
            </span>
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <div className="wp-import-rating-fields">
            <label>
              Min
              <input
                max={maxRating}
                min="100"
                onChange={(event) => setMinRating(Math.min(Number(event.target.value), maxRating))}
                type="number"
                value={minRating}
              />
            </label>
            <label>
              Max
              <input
                max="4000"
                min={minRating}
                onChange={(event) => setMaxRating(Math.max(Number(event.target.value), minRating))}
                type="number"
                value={maxRating}
              />
            </label>
          </div>
          <div className="wp-import-dual-range">
            <div aria-hidden="true" className="wp-import-dual-range__track">
              <span
                style={{
                  left: `${((minRating - 100) / 3900) * 100}%`,
                  right: `${100 - ((maxRating - 100) / 3900) * 100}%`,
                }}
              />
            </div>
            <input
              aria-label="Difficulté minimale"
              max="4000"
              min="100"
              onChange={(event) => setMinRating(Math.min(Number(event.target.value), maxRating))}
              type="range"
              value={minRating}
            />
            <input
              aria-label="Difficulté maximale"
              max="4000"
              min="100"
              onChange={(event) => setMaxRating(Math.max(Number(event.target.value), minRating))}
              type="range"
              value={maxRating}
            />
          </div>
          {!ratingsAreValid ? (
            <p className="alert error-alert">
              La plage doit contenir des ratings entiers entre 100 et 4 000.
            </p>
          ) : null}
        </details>
        <details className="wp-panel wp-import-step wp-import-step-card" open>
          <summary>
            <span>
              <h3>3. Thèmes (optionnel)</h3>
              <p>
                Sélectionnez des thèmes, des phases ou des ouvertures. Chaque puzzle correspond à au moins une
                catégorie sélectionnée.
              </p>
            </span>
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <label className="wp-import-search-field">
            <Search aria-hidden="true" size={16} />
            <input
              onChange={(event) => setThemeQuery(event.target.value)}
              aria-label="Rechercher un thème, une phase ou une ouverture"
              placeholder="Rechercher un thème, une phase ou une ouverture..."
              value={themeQuery}
            />
          </label>
          {selectedThemes.length ? (
            <div className="wp-import-theme-list">
              {selectedThemes.map((theme) => (
                <button
                  aria-label={`Retirer ${searchOptions.find((option) => option.value === theme)?.label ?? theme}`}
                  className="wp-import-theme-chip is-selected"
                  key={theme}
                  onClick={() => removeTheme(theme)}
                  type="button"
                >
                  {searchOptions.find((option) => option.value === theme)?.label ?? theme}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          ) : null}
          {themeQuery.trim() ? (
            <div className="wp-import-theme-options">
              {filteredThemeOptions.length ? (
                filteredThemeOptions.map((option) => (
                  <button
                    className="wp-import-theme-chip"
                    key={`${option.kind}-${option.value}`}
                    title={option.label}
                    onClick={() => addTheme(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <p className="wp-import-theme-empty">Aucun thème correspondant.</p>
              )}
            </div>
          ) : null}
          {optionsError ? <p role="status">{optionsError}</p> : null}
        </details>
        {selectedThemes.length >= 2 ? (
          <details className="wp-panel wp-import-step wp-import-step-card" open>
            <summary>
              <span>
                <h3>4. Répartition (optionnel)</h3>
                <p>Choisissez comment répartir les puzzles.</p>
              </span>
              <ChevronDown aria-hidden="true" size={18} />
            </summary>
            <div className="wp-import-distribution-options">
              <button
                aria-pressed={distribution === 'random'}
                className={distribution === 'random' ? 'is-selected' : ''}
                onClick={() => setDistribution('random')}
                type="button"
              >
                <span className="wp-import-radio" /> <strong>Répartition aléatoire</strong>
                <small>Lichess répartit automatiquement les puzzles.</small>
              </button>
              <button
                aria-pressed={distribution === 'custom'}
                className={distribution === 'custom' ? 'is-selected' : ''}
                onClick={() => setDistribution('custom')}
                type="button"
              >
                <span className="wp-import-radio" /> <strong>Répartition personnalisée</strong>
                <small>Définissez un pourcentage pour chaque thème choisi.</small>
              </button>
            </div>
            {distribution === 'custom' && selectedThemes.length ? (
              <div className="wp-import-theme-distribution">
                {selectedThemes.map((theme) => (
                  <label key={theme}>
                    <span>{searchOptions.find((option) => option.value === theme)?.label ?? theme}</span>
                    <div>
                      <input
                        max="100"
                        min="0"
                        onChange={(event) =>
                          setThemeDistribution((current) => ({
                            ...current,
                            [theme]: Number(event.target.value),
                          }))
                        }
                        type="number"
                        value={themeDistribution[theme] ?? 0}
                      />
                      <small>%</small>
                    </div>
                  </label>
                ))}
              </div>
            ) : null}
            {!customDistributionIsValid ? (
              <p className="alert error-alert">La répartition personnalisée doit totaliser 100 %.</p>
            ) : null}
          </details>
        ) : null}
        <details className="wp-panel wp-import-advanced">
          <summary>
            <span>{selectedThemes.length >= 2 ? 5 : 4}. Options avancées</span>
            <ChevronDown aria-hidden="true" size={18} />
          </summary>
          <div className="wp-import-advanced-grid">
            <label>
              Nombre min de coups
              <input
                min="1"
                onChange={(event) => setMinMoves(event.target.value)}
                placeholder="Ex : 1"
                type="number"
                value={minMoves}
              />
            </label>
            <label>
              Nombre max de coups
              <input
                min="1"
                onChange={(event) => setMaxMoves(event.target.value)}
                placeholder="Ex : 10"
                type="number"
                value={maxMoves}
              />
            </label>
          </div>
          {!moveRangeIsValid ? (
            <p className="alert error-alert">
              La longueur doit être un nombre positif et le minimum ne peut pas dépasser le maximum.
            </p>
          ) : null}
        </details>
      </div>
      <aside className="wp-panel wp-import-summary">
        <div>
          <Sparkles aria-hidden="true" size={22} />
          <h3>Résumé de votre set</h3>
        </div>
        <dl>
          <div>
            <dt>Puzzles</dt>
            <dd>{countIsValid ? count : '—'}</dd>
          </div>
          <div>
            <dt>Difficulté</dt>
            <dd>{ratingsAreValid ? `${minRating} – ${maxRating}` : 'À corriger'}</dd>
          </div>
          <div>
            <dt>Thèmes</dt>
            <dd>
              {selectedThemeLabels.length ? `${selectedThemeLabels.length} sélectionnés` : 'Tous les thèmes'}
            </dd>
          </div>
          <div>
            <dt>Répartition</dt>
            <dd>{distribution === 'custom' ? 'Personnalisée' : 'Aléatoire'}</dd>
          </div>
          <div>
            <dt>Nombre min de coups</dt>
            <dd>{parsedMinMoves ?? 'Aucun'}</dd>
          </div>
          <div>
            <dt>Nombre max de coups</dt>
            <dd>{parsedMaxMoves ?? 'Aucun'}</dd>
          </div>
        </dl>
        <p className="wp-import-summary-note">
          <strong>Disponibilité actuelle</strong>
          <br />
          {availablePuzzleCount === null
            ? 'Indisponible pour le moment.'
            : `${formatInteger(availablePuzzleCount)} puzzles disponibles avec ces filtres.`}
        </p>
        <LoadingButton
          loadingLabel="Génération en cours…"
          loading={isImportingLichess}
          className="wp-primary full"
          disabled={
            !countIsValid ||
            !ratingsAreValid ||
            !moveRangeIsValid ||
            !customDistributionIsValid ||
            isImportingLichess ||
            !canImportIntoTraining
          }
          onClick={() =>
            onImportLichess({
              count,
              minRating,
              maxRating,
              themes: selectedThemes,
              distribution,
              themeDistribution: distribution === 'custom' ? themeDistribution : undefined,
              minMoves: parsedMinMoves,
              maxMoves: parsedMaxMoves,
            })
          }
          type="button"
        >
          {isImportingLichess ? 'Génération en cours...' : `Générer les ${count} puzzles`}
        </LoadingButton>
        <small className="wp-import-summary-footnote">Un set sera créé et ajouté à votre entraînement.</small>
      </aside>
    </section>
  );
}
