import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../../shared/api/client';
import type { AuthSession } from '../auth/authStorage';

type TrainingsPanelProps = {
  session: AuthSession;
  onLogout: () => void;
};

type Training = {
  '@id': string;
  id: number;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
};

type TrainingCollection = {
  member?: Training[];
  'hydra:member'?: Training[];
};

export function TrainingsPanel({ session, onLogout }: TrainingsPanelProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const trainingsQuery = useQuery({
    queryKey: ['trainings', session.email],
    queryFn: async () => {
      const collection = await apiRequest<TrainingCollection>('/trainings', {
        token: session.token,
      });

      return collection.member ?? collection['hydra:member'] ?? [];
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async () =>
      apiRequest<Training>('/trainings', {
        method: 'POST',
        token: session.token,
        body: {
          name: name.trim(),
          description: description.trim() || null,
        },
      }),
    onSuccess: async () => {
      setName('');
      setDescription('');
      await queryClient.invalidateQueries({ queryKey: ['trainings', session.email] });
    },
  });

  return (
    <section className="dashboard-grid">
      <div className="card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Session</p>
            <h2>Bienvenue</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onLogout}>
            Se déconnecter
          </button>
        </div>
        <p className="muted">
          Connecté avec <strong>{session.email}</strong>. Les entraînements affichés ici sont filtrés
          côté API pour cet utilisateur.
        </p>
      </div>

      <div className="card">
        <p className="eyebrow">Nouvel entraînement</p>
        <h2>Créer un cycle Woodpecker</h2>
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            createTrainingMutation.mutate();
          }}
        >
          <label>
            Nom
            <input
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tactics set - juillet"
              required
              value={name}
            />
          </label>

          <label>
            Description
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Objectif, source des puzzles, cadence..."
              rows={4}
              value={description}
            />
          </label>

          {createTrainingMutation.isError && (
            <p className="alert error-alert">{createTrainingMutation.error.message}</p>
          )}

          <button
            className="primary-button"
            disabled={createTrainingMutation.isPending || name.trim().length === 0}
            type="submit"
          >
            {createTrainingMutation.isPending ? 'Création...' : "Créer l'entraînement"}
          </button>
        </form>
      </div>

      <div className="card trainings-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Mes entraînements</p>
            <h2>Liste privée</h2>
          </div>
          <span className="status-pill status-ok">
            {trainingsQuery.data?.length ?? 0} training{(trainingsQuery.data?.length ?? 0) > 1 ? 's' : ''}
          </span>
        </div>

        {trainingsQuery.isLoading && <p className="muted">Chargement des entraînements...</p>}
        {trainingsQuery.isError && <p className="alert error-alert">{trainingsQuery.error.message}</p>}

        {trainingsQuery.isSuccess && trainingsQuery.data.length === 0 && (
          <p className="empty-state">Aucun entraînement pour l’instant. Crée le premier.</p>
        )}

        {trainingsQuery.isSuccess && trainingsQuery.data.length > 0 && (
          <ul className="training-list">
            {trainingsQuery.data.map((training) => (
              <li key={training['@id']}>
                <div>
                  <strong>{training.name}</strong>
                  {training.description && <p>{training.description}</p>}
                </div>
                <span>{training.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
