import TrainingIdentityFormView from './TrainingIdentityFormView';

type TrainingsEditViewProps = {
  description: string;
  errorMessage?: string;
  icon: string;
  iconBackgroundColor: string;
  iconColor: string;
  isError: boolean;
  isLoading?: boolean;
  isPending: boolean;
  name: string;
  onDescriptionChange: (value: string) => void;
  onIconBackgroundColorChange: (value: string) => void;
  onIconChange: (value: 'pawn' | 'king' | 'queen' | 'knight' | 'bishop' | 'rook') => void;
  onIconColorChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function EditTrainingView(props: TrainingsEditViewProps) {
  const {
    description,
    errorMessage,
    icon,
    iconBackgroundColor,
    iconColor,
    isError,
    isLoading = false,
    isPending,
    name,
    onDescriptionChange,
    onIconBackgroundColorChange,
    onIconChange,
    onIconColorChange,
    onNameChange,
    onSubmit,
  } = props;

  return (
    <>
      <TrainingIdentityFormView
        description={description}
        disabled={isPending}
        icon={icon}
        iconBackgroundColor={iconBackgroundColor}
        iconColor={iconColor}
        isLoading={isLoading}
        mode="edit"
        name={name}
        onDescriptionChange={onDescriptionChange}
        onIconBackgroundColorChange={onIconBackgroundColorChange}
        onIconChange={onIconChange}
        onIconColorChange={onIconColorChange}
        onNameChange={onNameChange}
        onSubmit={onSubmit}
        submitLabel="Enregistrer les modifications"
        submitPendingLabel="Enregistrement..."
        subtitle="Modifiez les informations et l'identité visuelle de votre entraînement."
        title="Modifier l'entraînement"
      />
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
    </>
  );
}

export default EditTrainingView;
