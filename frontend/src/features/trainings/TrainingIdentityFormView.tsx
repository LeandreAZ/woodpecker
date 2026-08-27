import { useEffect, useId, useState } from 'react';
import { FileText, Palette, Pencil } from 'lucide-react';
import { TrainingLogoBadge, resolveTrainingBranding } from './TrainingBranding';
import { TrainingIconCustomizer } from './TrainingIconCustomizer';
import './training-identity-form.css';

type TrainingIdentityFormViewProps = {
  backLabel?: string;
  description: string;
  disabled?: boolean;
  icon: string;
  iconBackgroundColor: string;
  iconColor: string;
  isLoading?: boolean;
  mode: 'create' | 'edit';
  name: string;
  onBack?: () => void;
  onDescriptionChange: (value: string) => void;
  onIconBackgroundColorChange: (value: string) => void;
  onIconChange: (value: 'pawn' | 'king' | 'queen' | 'knight' | 'bishop' | 'rook') => void;
  onIconColorChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitPendingLabel: string;
  subtitle: string;
  title: string;
};

export function TrainingIdentityFormView({
  backLabel,
  description,
  disabled = false,
  icon,
  iconBackgroundColor,
  iconColor,
  isLoading = false,
  mode,
  name,
  onBack,
  onDescriptionChange,
  onIconBackgroundColorChange,
  onIconChange,
  onIconColorChange,
  onNameChange,
  onSubmit,
  submitLabel,
  submitPendingLabel,
  subtitle,
  title,
}: TrainingIdentityFormViewProps) {
  const descriptionId = useId();
  const nameId = useId();
  const [isIconCustomizerOpen, setIsIconCustomizerOpen] = useState(false);
  const branding = resolveTrainingBranding({
    icon,
    iconBackgroundColor,
    iconColor,
    name,
  });

  useEffect(() => {
    if (!isIconCustomizerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isIconCustomizerOpen]);

  if (isLoading) {
    return (
      <div className={'wp-page wp-training-form-page wp-training-form-page--' + mode}>
        <header className="wp-training-form-page__header">
          <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--title" aria-hidden="true" />
          <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--subtitle" aria-hidden="true" />
        </header>

        <section className="wp-training-identity-card wp-training-identity-card--loading" aria-label="Chargement de l'entraînement">
          <div className="wp-training-identity-form">
            <div className="wp-training-identity-card__section-head">
              <span className="wp-training-identity-card__section-icon" aria-hidden="true">
                <FileText size={22} strokeWidth={1.9} />
              </span>
              <div>
                <h2>Informations générales</h2>
              </div>
            </div>

            <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--field" aria-hidden="true" />
            <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--textarea" aria-hidden="true" />
            <div className="wp-training-identity-form__separator" />

            <div className="wp-training-identity-icon-card">
              <div className="wp-training-identity-card__section-head wp-training-identity-card__section-head--icon">
                <span className="wp-training-identity-card__section-icon wp-training-identity-card__section-icon--violet" aria-hidden="true">
                  <Palette size={22} strokeWidth={1.9} />
                </span>
                <div>
                  <h2>Icône de l'entraînement</h2>
                  <p>Personnalisez l'icône et la couleur de votre entraînement.</p>
                </div>
              </div>

              <div className="wp-training-identity-icon-card__body">
                <div className="wp-training-identity-icon-card__preview wp-training-identity-icon-card__preview--loading" aria-hidden="true" />
                <div className="wp-training-identity-icon-card__controls">
                  <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--button" aria-hidden="true" />
                  <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--copy" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="wp-training-form-page__skeleton wp-training-form-page__skeleton--submit" aria-hidden="true" />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={'wp-page wp-training-form-page wp-training-form-page--' + mode}>
      <header className="wp-training-form-page__header">
        {onBack && backLabel ? (
          <button className="wp-link-button wp-training-form-page__back" type="button" onClick={onBack}>
            ← {backLabel}
          </button>
        ) : null}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      <section className="wp-training-identity-card">
        <form
          className="wp-training-identity-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="wp-training-identity-card__section-head">
            <span className="wp-training-identity-card__section-icon" aria-hidden="true">
              <FileText size={22} strokeWidth={1.9} />
            </span>
            <div>
              <h2>Informations générales</h2>
            </div>
          </div>

          <label className="wp-training-identity-form__field" htmlFor={nameId}>
            <span>Nom de l'entraînement <strong>*</strong></span>
            <input
              id={nameId}
              maxLength={120}
              placeholder="Ex : Maîtrise des finales de tours"
              required
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
            <small>Donnez un nom clair et identifiable à votre entraînement.</small>
          </label>

          <label className="wp-training-identity-form__field" htmlFor={descriptionId}>
            <span>Description (facultatif)</span>
            <textarea
              id={descriptionId}
              maxLength={200}
              placeholder="Décrivez l'objectif de cet entraînement..."
              rows={4}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
            <div className="wp-training-identity-form__field-meta">
              <small>Cette description vous aidera à identifier rapidement l'objectif de cet entraînement.</small>
              <small>{description.length}/200</small>
            </div>
          </label>

          <div className="wp-training-identity-form__separator" />

          <div className="wp-training-identity-icon-card">
            <div className="wp-training-identity-card__section-head wp-training-identity-card__section-head--icon">
              <span className="wp-training-identity-card__section-icon wp-training-identity-card__section-icon--violet" aria-hidden="true">
                <Palette size={22} strokeWidth={1.9} />
              </span>
              <div>
                <h2>Icône de l'entraînement</h2>
                <p>Personnalisez l'icône et la couleur de votre entraînement.</p>
              </div>
            </div>

            <div className="wp-training-identity-icon-card__body">
              <div className="wp-training-identity-icon-card__preview">
                <TrainingLogoBadge
                  className="wp-training-identity-icon-card__badge"
                  size="lg"
                  training={branding}
                />
              </div>

              <div className="wp-training-identity-icon-card__controls">
                <button className="wp-secondary wp-training-identity-icon-card__toggle" type="button" onClick={() => setIsIconCustomizerOpen(true)}>
                  <Pencil aria-hidden="true" size={16} strokeWidth={2} />
                  <span>Personnaliser l'icône</span>
                </button>
                <p>Choisissez une pièce d'échecs et une couleur de fond qui représenteront votre entraînement.</p>
              </div>
            </div>
          </div>

          <button
            className={'wp-primary wp-training-identity-form__submit wp-training-identity-form__submit--' + mode}
            disabled={disabled || name.trim().length === 0}
            type="submit"
          >
            {disabled ? submitPendingLabel : submitLabel}
          </button>
        </form>
      </section>

      <TrainingIconCustomizer
        isOpen={isIconCustomizerOpen}
        value={branding}
        onApply={(nextBranding) => {
          onIconChange(nextBranding.icon);
          onIconBackgroundColorChange(nextBranding.iconBackgroundColor);
          onIconColorChange(nextBranding.iconColor);
          setIsIconCustomizerOpen(false);
        }}
        onClose={() => setIsIconCustomizerOpen(false)}
      />
    </div>
  );
}

export default TrainingIdentityFormView;
