import { useEffect } from 'react';
import TrainingIdentityFormView from './TrainingIdentityFormView';

type TrainingsCreateViewProps = {
  description: string;
  errorMessage?: string;
  icon: string;
  iconBackgroundColor: string;
  iconColor: string;
  isError: boolean;
  isPending: boolean;
  name: string;
  onDescriptionChange: (value: string) => void;
  onIconBackgroundColorChange: (value: string) => void;
  onIconChange: (value: 'pawn' | 'king' | 'queen' | 'knight' | 'bishop' | 'rook') => void;
  onIconColorChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onResetDraft: () => void;
  onSubmit: () => void;
};

export function CreateTrainingView(props: TrainingsCreateViewProps) {
  const {
    description,
    errorMessage,
    icon,
    iconBackgroundColor,
    iconColor,
    isError,
    isPending,
    name,
    onDescriptionChange,
    onIconBackgroundColorChange,
    onIconChange,
    onIconColorChange,
    onNameChange,
    onResetDraft,
    onSubmit,
  } = props;

  useEffect(() => {
    onResetDraft();
    // The create draft must reset only when entering the screen, not on every rerender.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TrainingIdentityFormView
        description={description}
        disabled={isPending}
        icon={icon}
        iconBackgroundColor={iconBackgroundColor}
        iconColor={iconColor}
        mode="create"
        name={name}
        onDescriptionChange={onDescriptionChange}
        onIconBackgroundColorChange={onIconBackgroundColorChange}
        onIconChange={onIconChange}
        onIconColorChange={onIconColorChange}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
        submitLabel="Créer l'entraînement"
        submitPendingLabel="Création..."
        subtitle="Créez votre entraînement et personnalisez son identité."
        title="Créer un entraînement"
      />
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
    </>
  );
}

export default CreateTrainingView;
