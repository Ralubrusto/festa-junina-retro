import { Flame, Fish, Mail, PartyPopper } from "lucide-react";
import type {
  Avatar,
  FeedbackItem,
  Participant,
  RetroStation,
  SessionStatus,
} from "../../types/domain";
import { FeedbackComposer } from "../retro/FeedbackComposer";

type PartyMapProps = {
  sessionTitle: string;
  sessionStatus: SessionStatus;
  currentParticipantId: string;
  displayName: string;
  avatar: Avatar;
  participants: Participant[];
  feedbacks: FeedbackItem[];
  selectedStation: RetroStation | null;
  onSelectStation: (station: RetroStation | null) => void;
  onCreateFeedback: (text: string) => void;
  onOpenAdmin: () => void;
};

const stations: RetroStation[] = [
  {
    category: "positive",
    title: "Bandeirinhas",
    description: "O que funcionou bem na sprint?",
    cta: "Registrar ponto positivo",
  },
  {
    category: "negative",
    title: "Fogueira",
    description: "O que queimou energia ou travou o time?",
    cta: "Registrar dificuldade",
  },
  {
    category: "thanks",
    title: "Correio elegante",
    description: "Quem merece reconhecimento ou agradecimento?",
    cta: "Enviar agradecimento",
  },
  {
    category: "action",
    title: "Pescaria",
    description: "Que acao podemos pescar para a proxima sprint?",
    cta: "Sugerir acao",
  },
];

const stationIcons = {
  positive: PartyPopper,
  negative: Flame,
  thanks: Mail,
  action: Fish,
};

export function PartyMap({
  sessionTitle,
  sessionStatus,
  currentParticipantId,
  displayName,
  avatar,
  participants,
  feedbacks,
  selectedStation,
  onSelectStation,
  onCreateFeedback,
  onOpenAdmin,
}: PartyMapProps) {
  const isClosed = sessionStatus === "closed";

  return (
    <main className="party-layout">
      <header className="party-header">
        <div>
          <p className="eyebrow">Festa aberta</p>
          <h1>{sessionTitle}</h1>
        </div>
        <div className="party-header-actions">
          <div className="participant-pill">
            <span
              className="mini-avatar"
              style={{ backgroundColor: avatar.color }}
            />
            <span>{displayName}</span>
          </div>
          <div className="participant-count">
            {participants.length} participantes
          </div>
          <button type="button" className="admin-link" onClick={onOpenAdmin}>
            Admin
          </button>
        </div>
      </header>

      <section className="party-yard">
        <div className="flag-line" />
        <div className="participant-circle" aria-label="Participantes na festa">
          {participants.length === 0 ? (
            <p className="empty-state">Participantes aparecerão aqui.</p>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.id}
                className={
                  participant.id === currentParticipantId
                    ? "party-participant current"
                    : "party-participant"
                }
              >
                <span
                  className="party-avatar"
                  style={{ backgroundColor: participant.avatar.color }}
                />
                <span>{participant.displayName}</span>
              </div>
            ))
          )}
        </div>
        <div className="station-grid">
          {stations.map((station) => {
            const Icon = stationIcons[station.category];
            const stationCount = feedbacks.filter(
              (feedback) => feedback.category === station.category,
            ).length;

            return (
              <button
                key={station.category}
                type="button"
                className={`station station-${station.category}`}
                disabled={isClosed}
                onClick={() => onSelectStation(station)}
              >
                <Icon size={28} />
                <span className="station-title">{station.title}</span>
                <span className="station-description">{station.description}</span>
                <span className="station-count">{stationCount} feedbacks</span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="feedback-board">
        <div>
          <p className="eyebrow">Mural da retro</p>
          <h2>Feedbacks da sessao</h2>
        </div>
        {isClosed ? (
          <p className="session-closed-message">
            A sessao foi encerrada pelo admin.
          </p>
        ) : null}
        {feedbacks.length === 0 ? (
          <p className="empty-state">
            Clique em uma barraca para registrar o primeiro feedback.
          </p>
        ) : (
          <div className="feedback-list">
            {feedbacks.map((feedback) => (
              <article key={feedback.id} className="feedback-card">
                <span>{getCategoryLabel(feedback.category)}</span>
                <p>{feedback.text}</p>
                <small>
                  {feedback.authorName} - {feedback.createdAt}
                </small>
              </article>
            ))}
          </div>
        )}
      </aside>

      {selectedStation ? (
        <FeedbackComposer
          station={selectedStation}
          onClose={() => onSelectStation(null)}
          onSubmit={onCreateFeedback}
        />
      ) : null}
    </main>
  );
}

function getCategoryLabel(category: FeedbackItem["category"]) {
  const labels = {
    positive: "Ponto positivo",
    negative: "Dificuldade",
    thanks: "Agradecimento",
    action: "Acao",
  };

  return labels[category];
}
