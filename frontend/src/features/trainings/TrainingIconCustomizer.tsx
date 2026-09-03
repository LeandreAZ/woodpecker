import { useEffect, useId, useState } from 'react';
import { Copy, X } from 'lucide-react';
import {
  TRAINING_ICON_PIECES,
  TrainingLogoBadge,
  TrainingPieceIcon,
  isValidHexColor,
  normalizeTrainingBackgroundColor,
  normalizeTrainingIconColor,
  normalizeTrainingPiece,
  type PieceName,
} from './TrainingBranding';
import './training-icon-customizer.css';

type TrainingIconCustomizerValue = {
  icon: string;
  iconBackgroundColor: string;
  iconColor: string;
};

type TrainingIconCustomizerProps = {
  isOpen: boolean;
  onApply: (value: { icon: PieceName; iconBackgroundColor: string; iconColor: string }) => void;
  onClose: () => void;
  value: TrainingIconCustomizerValue;
};

const PIECE_LABELS: Record<PieceName, string> = {
  bishop: 'Fou',
  king: 'Roi',
  knight: 'Cavalier',
  pawn: 'Pion',
  queen: 'Dame',
  rook: 'Tour',
};

type ColorKey = 'iconBackgroundColor' | 'iconColor';

type DialogProps = Omit<TrainingIconCustomizerProps, 'isOpen'>;

export function TrainingIconCustomizer({ isOpen, onApply, onClose, value }: TrainingIconCustomizerProps) {
  if (!isOpen) {
    return null;
  }

  return <TrainingIconCustomizerDialog onApply={onApply} onClose={onClose} value={value} />;
}

function TrainingIconCustomizerDialog({ onApply, onClose, value }: DialogProps) {
  const backgroundHexId = useId();
  const iconHexId = useId();
  const [draft, setDraft] = useState(() => ({
    icon: normalizeTrainingPiece(value.icon),
    iconBackgroundColor: normalizeTrainingBackgroundColor(value.iconBackgroundColor),
    iconColor: normalizeTrainingIconColor(value.iconColor),
  }));
  const [backgroundHexInput, setBackgroundHexInput] = useState(draft.iconBackgroundColor.toUpperCase());
  const [iconHexInput, setIconHexInput] = useState(draft.iconColor.toUpperCase());
  const [backgroundError, setBackgroundError] = useState('');
  const [iconError, setIconError] = useState('');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function applyColorValue(key: ColorKey, nextValue: string) {
    if (key === 'iconBackgroundColor') {
      const normalized = normalizeTrainingBackgroundColor(nextValue);
      setDraft((current) => ({ ...current, iconBackgroundColor: normalized }));
      setBackgroundHexInput(normalized.toUpperCase());
      setBackgroundError('');
      return;
    }

    const normalized = normalizeTrainingIconColor(nextValue);
    setDraft((current) => ({ ...current, iconColor: normalized }));
    setIconHexInput(normalized.toUpperCase());
    setIconError('');
  }

  function updateHexDraft(key: ColorKey, nextValue: string) {
    const normalizedInput = nextValue.startsWith('#') ? nextValue.toUpperCase() : '#' + nextValue.toUpperCase();

    if (key === 'iconBackgroundColor') {
      setBackgroundHexInput(normalizedInput);
      if (isValidHexColor(normalizedInput)) {
        setDraft((current) => ({ ...current, iconBackgroundColor: normalizeTrainingBackgroundColor(normalizedInput) }));
        setBackgroundError('');
      }
      return;
    }

    setIconHexInput(normalizedInput);
    if (isValidHexColor(normalizedInput)) {
      setDraft((current) => ({ ...current, iconColor: normalizeTrainingIconColor(normalizedInput) }));
      setIconError('');
    }
  }

  function validateHex(key: ColorKey, valueToValidate: string) {
    const normalized = valueToValidate.startsWith('#') ? valueToValidate : '#' + valueToValidate;
    const valid = isValidHexColor(normalized);
    const message = valid ? '' : 'Entrez un code HEX valide.';

    if (key === 'iconBackgroundColor') {
      setBackgroundError(message);
    } else {
      setIconError(message);
    }

    return valid ? normalized : null;
  }

  function handleApply() {
    const normalizedBackground = validateHex('iconBackgroundColor', backgroundHexInput);
    const normalizedIconColor = validateHex('iconColor', iconHexInput);

    if (!normalizedBackground || !normalizedIconColor) {
      return;
    }

    onApply({
      icon: draft.icon,
      iconBackgroundColor: normalizeTrainingBackgroundColor(normalizedBackground),
      iconColor: normalizeTrainingIconColor(normalizedIconColor),
    });
  }

  async function copyHex(valueToCopy: string) {
    try {
      await navigator.clipboard.writeText(valueToCopy);
    } catch {
      // no-op
    }
  }

  return (
    <div className="wp-training-icon-modal" role="dialog" aria-modal="true" aria-labelledby="training-icon-modal-title">
      <button className="wp-training-icon-modal__overlay" type="button" aria-label="Fermer la personnalisation de l'icône" onClick={onClose} />
      <div className="wp-training-icon-modal__surface">
        <div className="wp-training-icon-modal__header">
          <div>
            <h2 id="training-icon-modal-title">Personnaliser l'icône</h2>
            <p>Choisissez une pièce et une couleur pour votre entraînement.</p>
          </div>
          <button className="ui-modal-close wp-training-icon-modal__close" type="button" aria-label="Fermer" onClick={onClose}>
            <X aria-hidden="true" size={24} strokeWidth={2} />
          </button>
        </div>

        <div className="wp-training-icon-modal__section">
          <h3>Icône</h3>
          <div className="wp-training-icon-modal__pieces">
            {TRAINING_ICON_PIECES.map((piece) => {
              const isActive = draft.icon === piece;
              return (
                <button
                  key={piece}
                  className={isActive ? 'wp-training-icon-modal__piece is-active' : 'wp-training-icon-modal__piece'}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setDraft((current) => ({ ...current, icon: piece }))}
                >
                  <span className="wp-training-icon-modal__piece-preview" aria-hidden="true">
                    <TrainingPieceIcon className="wp-training-icon-modal__piece-glyph" piece={piece} />
                  </span>
                  <span>{PIECE_LABELS[piece]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="wp-training-icon-modal__section wp-training-icon-modal__section--colors">
          <div className="wp-training-icon-modal__color-block">
            <h3>Couleur de fond</h3>
            <div className="wp-training-icon-modal__color-grid">
              <label className="wp-training-icon-modal__color-wheel">
                <span className="wp-training-icon-modal__color-wheel-core" style={{ background: draft.iconBackgroundColor }} />
                <input
                  aria-label="Choisir la couleur de fond"
                  type="color"
                  value={draft.iconBackgroundColor}
                  onChange={(event) => applyColorValue('iconBackgroundColor', event.target.value)}
                />
              </label>
              <div className="wp-training-icon-modal__color-form">
                <label htmlFor={backgroundHexId}>Couleur HEX</label>
                <div className="wp-training-icon-modal__hex-row">
                  <input id={backgroundHexId} maxLength={7} value={backgroundHexInput} onChange={(event) => updateHexDraft('iconBackgroundColor', event.target.value)} />
                  <button type="button" aria-label="Copier la couleur de fond" onClick={() => copyHex(draft.iconBackgroundColor)}>
                    <Copy aria-hidden="true" size={16} strokeWidth={2} />
                  </button>
                </div>
                <small>{backgroundError || 'Entrez un code HEX valide.'}</small>
              </div>
            </div>
          </div>

          <div className="wp-training-icon-modal__color-block wp-training-icon-modal__color-block--secondary">
            <h3>Couleur de l'icône</h3>
            <div className="wp-training-icon-modal__color-grid wp-training-icon-modal__color-grid--compact">
              <label className="wp-training-icon-modal__color-wheel wp-training-icon-modal__color-wheel--small">
                <span className="wp-training-icon-modal__color-wheel-core wp-training-icon-modal__color-wheel-core--icon" style={{ background: draft.iconColor }} />
                <input
                  aria-label="Choisir la couleur de l'icône"
                  type="color"
                  value={draft.iconColor}
                  onChange={(event) => applyColorValue('iconColor', event.target.value)}
                />
              </label>
              <div className="wp-training-icon-modal__color-form">
                <label htmlFor={iconHexId}>Couleur HEX</label>
                <div className="wp-training-icon-modal__hex-row">
                  <input id={iconHexId} maxLength={7} value={iconHexInput} onChange={(event) => updateHexDraft('iconColor', event.target.value)} />
                  <button type="button" aria-label="Copier la couleur de l'icône" onClick={() => copyHex(draft.iconColor)}>
                    <Copy aria-hidden="true" size={16} strokeWidth={2} />
                  </button>
                </div>
                <small>{iconError || 'Entrez un code HEX valide.'}</small>
              </div>
            </div>
          </div>

          <div className="wp-training-icon-modal__preview-panel">
            <h3>Aperçu</h3>
            <p>Rendu de votre entraînement</p>
            <div className="wp-training-icon-modal__preview-box">
              <TrainingLogoBadge size="lg" training={draft} />
            </div>
          </div>
        </div>

        <div className="wp-training-icon-modal__footer">
          <button className="wp-secondary wp-training-icon-modal__footer-button" type="button" onClick={onClose}>Annuler</button>
          <button className="wp-primary wp-training-icon-modal__footer-button wp-training-icon-modal__footer-button--apply" type="button" onClick={handleApply}>Appliquer</button>
        </div>
      </div>
    </div>
  );
}

export default TrainingIconCustomizer;
