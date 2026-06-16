import { Copy, Eye, EyeOff, Lock, Play, Presentation } from "lucide-react";
import type { ReactNode } from "react";
import type {
  FeedbackCategory,
  FeedbackItem,
  RetroSession,
  SessionStatus,
} from "../../types/domain";

type AdminPanelProps = {
  session: RetroSession;
  feedbacks: FeedbackItem[];
  onBackToParty: () => void;
  onChangeFeedbackVisibility: (
    feedbackId: string,
    hiddenByAdmin: boolean,
  ) => void;
  onChangeSessionStatus: (status: SessionStatus) => void;
};

const categories: Array<{
  category: FeedbackCategory;
  title: string;
  emptyText: string;
}> = [
  {
    category: "positive",
    title: "Pontos positivos",
    emptyText: "Nenhum ponto positivo registrado.",
  },
  {
    category: "negative",
    title: "Dificuldades",
    emptyText: "Nenhuma dificuldade registrada.",
  },
  {
    category: "thanks",
    title: "Agradecimentos",
    emptyText: "Nenhum agradecimento registrado.",
  },
  {
    category: "action",
    title: "Acoes",
    emptyText: "Nenhuma acao registrada.",
  },
];

export function AdminPanel({
  session,
  feedbacks,
  onBackToParty,
  onChangeFeedbackVisibility,
  onChangeSessionStatus,
}: AdminPanelProps) {
  const visibleFeedbacks = feedbacks.filter((feedback) => !feedback.hiddenByAdmin);
  const hiddenFeedbacks = feedbacks.filter((feedback) => feedback.hiddenByAdmin);

  async function handleCopySummary() {
    const summary = categories
      .map(({ category, title }) => {
        const categoryFeedbacks = visibleFeedbacks.filter(
          (feedback) => feedback.category === category,
        );

        if (categoryFeedbacks.length === 0) {
          return `${title}\n- Sem registros`;
        }

        return [
          title,
          ...categoryFeedbacks.map(
            (feedback) => `- ${feedback.text} (${feedback.authorName})`,
          ),
        ].join("\n");
      })
      .join("\n\n");

    await navigator.clipboard.writeText(summary);
  }

  return (
    <main className="admin-layout">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Painel admin</p>
          <h1>{session.title}</h1>
          <p className="admin-subtitle">
            {visibleFeedbacks.length} visiveis, {hiddenFeedbacks.length} ocultos
          </p>
        </div>

        <div className="admin-actions">
          <StatusButton
            icon={<Play size={18} />}
            label="Abrir"
            isActive={session.status === "open"}
            onClick={() => onChangeSessionStatus("open")}
          />
          <StatusButton
            icon={<Presentation size={18} />}
            label="Revisao"
            isActive={session.status === "review"}
            onClick={() => onChangeSessionStatus("review")}
          />
          <StatusButton
            icon={<Lock size={18} />}
            label="Fechar"
            isActive={session.status === "closed"}
            onClick={() => onChangeSessionStatus("closed")}
          />
          <button type="button" className="secondary-action" onClick={handleCopySummary}>
            <Copy size={18} />
            Copiar resumo
          </button>
          <button type="button" className="secondary-action" onClick={onBackToParty}>
            Voltar para festa
          </button>
        </div>
      </header>

      <section className="admin-grid">
        {categories.map(({ category, title, emptyText }) => {
          const categoryFeedbacks = feedbacks.filter(
            (feedback) => feedback.category === category,
          );
          const visibleCount = categoryFeedbacks.filter(
            (feedback) => !feedback.hiddenByAdmin,
          ).length;

          return (
            <section key={category} className="admin-column">
              <div className="admin-column-header">
                <h2>{title}</h2>
                <span>{visibleCount}</span>
              </div>

              {categoryFeedbacks.length === 0 ? (
                <p className="empty-state">{emptyText}</p>
              ) : (
                <div className="admin-feedback-list">
                  {categoryFeedbacks.map((feedback) => (
                    <article
                      key={feedback.id}
                      className={
                        feedback.hiddenByAdmin
                          ? "admin-feedback-card hidden"
                          : "admin-feedback-card"
                      }
                    >
                      <p>{feedback.text}</p>
                      <small>
                        {feedback.authorName} - {feedback.createdAt}
                      </small>
                      <button
                        type="button"
                        onClick={() =>
                          onChangeFeedbackVisibility(
                            feedback.id,
                            !feedback.hiddenByAdmin,
                          )
                        }
                      >
                        {feedback.hiddenByAdmin ? (
                          <>
                            <Eye size={16} />
                            Restaurar
                          </>
                        ) : (
                          <>
                            <EyeOff size={16} />
                            Ocultar
                          </>
                        )}
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </section>
    </main>
  );
}

type StatusButtonProps = {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function StatusButton({ icon, label, isActive, onClick }: StatusButtonProps) {
  return (
    <button
      type="button"
      className={isActive ? "status-button active" : "status-button"}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
