import { useEffect, useState } from "react";
import {
  signInAdminWithGoogle,
  subscribeToAdminAuth,
  type AdminAuthState,
} from "../features/admin/adminAuth";
import { AdminPanel } from "../features/admin/AdminPanel";
import { AvatarSetup } from "../features/avatar/AvatarSetup";
import { PartyMap } from "../features/party/PartyMap";
import { EntryScreen } from "../features/session/EntryScreen";
import {
  createFeedback,
  ensureAnonymousAuth,
  signInParticipant,
  subscribeToFeedbacks,
  subscribeToParticipants,
  subscribeToSession,
  updateFeedbackVisibility,
  updateParticipantAvatar,
  updateSessionStatus,
} from "../features/session/sessionService";
import { getInitialSession } from "../features/session/sessionRouting";
import type {
  AppStep,
  Avatar,
  FeedbackItem,
  Participant,
  RetroStation,
  SessionStatus,
} from "../types/domain";

const defaultAvatar: Avatar = {
  outfit: "Camisa xadrez",
  accessory: "Chapeu de palha",
  color: "#d1495b",
};

const initialAdminAuthState: AdminAuthState = {
  email: null,
  isAdmin: false,
  isChecking: true,
};

function App() {
  const [session, setSession] = useState(getInitialSession);
  const [step, setStep] = useState<AppStep>(() => {
    const url = new URL(window.location.href);

    return url.searchParams.get("admin") === "1" ? "admin" : "entry";
  });
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(defaultAvatar);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedStation, setSelectedStation] = useState<RetroStation | null>(
    null,
  );
  const [isEntering, setIsEntering] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminAuth, setAdminAuth] = useState<AdminAuthState>(
    initialAdminAuthState,
  );

  useEffect(() => subscribeToAdminAuth(setAdminAuth), []);

  useEffect(() => {
    let isMounted = true;

    ensureAnonymousAuth()
      .then(() => {
        if (isMounted) {
          setIsAuthReady(true);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          setErrorMessage("Nao foi possivel autenticar a sessao.");
          setIsAuthReady(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthReady) {
      return undefined;
    }

    const unsubscribeSession = subscribeToSession(session, (nextSession) => {
      setSession((currentSession) => {
        if (
          currentSession.title === nextSession.title &&
          currentSession.status === nextSession.status
        ) {
          return currentSession;
        }

        return nextSession;
      });
    });
    const unsubscribeFeedbacks = subscribeToFeedbacks(session, setFeedbacks);
    const unsubscribeParticipants = subscribeToParticipants(
      session,
      setParticipants,
    );

    return () => {
      unsubscribeSession();
      unsubscribeFeedbacks();
      unsubscribeParticipants();
    };
  }, [isAuthReady, session]);

  async function handleEnter(displayName: string) {
    setIsEntering(true);
    setErrorMessage(null);

    try {
      const signedParticipant = await signInParticipant(
        session,
        displayName,
        avatar,
      );
      setParticipant(signedParticipant);
      setAvatar(signedParticipant.avatar);
      setStep("avatar");
    } catch (error) {
      console.error(error);
      setErrorMessage("Nao foi possivel entrar na festa. Tente novamente.");
    } finally {
      setIsEntering(false);
    }
  }

  async function handleConfirmAvatar() {
    if (!participant) {
      return;
    }

    setIsSavingAvatar(true);
    setErrorMessage(null);

    const updatedParticipant = {
      ...participant,
      avatar,
    };

    try {
      await updateParticipantAvatar(session, updatedParticipant);
      setParticipant(updatedParticipant);
      setStep("party");
    } catch (error) {
      console.error(error);
      setErrorMessage("Nao foi possivel salvar o personagem. Tente novamente.");
    } finally {
      setIsSavingAvatar(false);
    }
  }

  async function handleCreateFeedback(text: string) {
    if (!participant || !selectedStation) {
      return;
    }

    if (session.status === "closed") {
      setErrorMessage("Esta sessao foi encerrada pelo admin.");
      return;
    }

    try {
      await createFeedback(
        session,
        participant,
        selectedStation.category,
        text,
      );
      setSelectedStation(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("Nao foi possivel salvar o feedback. Tente novamente.");
    }
  }

  function handleAvatarChange(nextAvatar: Avatar) {
    setAvatar(nextAvatar);
    setParticipant((currentParticipant) => {
      if (!currentParticipant) {
        return null;
      }

      return {
        ...currentParticipant,
        avatar: nextAvatar,
      };
    });
  }

  async function handleChangeFeedbackVisibility(
    feedbackId: string,
    hiddenByAdmin: boolean,
  ) {
    try {
      await updateFeedbackVisibility(session, feedbackId, hiddenByAdmin);
    } catch (error) {
      console.error(error);
      setErrorMessage("Nao foi possivel atualizar o feedback.");
    }
  }

  async function handleChangeSessionStatus(status: SessionStatus) {
    try {
      await updateSessionStatus(session, status);
    } catch (error) {
      console.error(error);
      setErrorMessage("Nao foi possivel atualizar a sessao.");
    }
  }

  function handleOpenAdmin() {
    const url = new URL(window.location.href);
    url.searchParams.set("admin", "1");
    window.history.pushState({}, "", url);
    setStep("admin");
  }

  function handleBackToParty() {
    const url = new URL(window.location.href);
    url.searchParams.delete("admin");
    window.history.pushState({}, "", url);
    setStep(participant ? "party" : "entry");
  }

  if (step === "admin") {
    if (adminAuth.isChecking) {
      return (
        <main className="admin-gate">
          <section className="panel admin-gate-panel">
            <p className="eyebrow">Painel admin</p>
            <h1>Verificando acesso</h1>
            <p>Aguarde um instante.</p>
          </section>
        </main>
      );
    }

    if (!adminAuth.isAdmin) {
      return (
        <main className="admin-gate">
          <section className="panel admin-gate-panel">
            <p className="eyebrow">Painel admin</p>
            <h1>Acesso restrito</h1>
            <p>
              Entre com o Google usando o e-mail administrador configurado para
              esta retro.
            </p>
            {adminAuth.email ? (
              <p className="admin-auth-note">
                Conta atual: {adminAuth.email}. Este e-mail nao esta na
                allowlist.
              </p>
            ) : null}
            <button type="button" onClick={signInAdminWithGoogle}>
              Entrar com Google
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={handleBackToParty}
            >
              Voltar
            </button>
          </section>
        </main>
      );
    }

    return (
      <AdminPanel
        session={session}
        feedbacks={feedbacks}
        onBackToParty={handleBackToParty}
        onChangeFeedbackVisibility={handleChangeFeedbackVisibility}
        onChangeSessionStatus={handleChangeSessionStatus}
      />
    );
  }

  if (step === "entry") {
    return (
      <EntryScreen
        sessionTitle={session.title}
        isLoading={isEntering}
        errorMessage={errorMessage}
        onSubmit={handleEnter}
      />
    );
  }

  if (step === "avatar" && participant) {
    return (
      <AvatarSetup
        displayName={participant.displayName}
        avatar={avatar}
        isSaving={isSavingAvatar}
        errorMessage={errorMessage}
        onChange={handleAvatarChange}
        onConfirm={handleConfirmAvatar}
      />
    );
  }

  if (step === "party" && participant) {
    const visibleFeedbacks = feedbacks.filter(
      (feedback) => !feedback.hiddenByAdmin,
    );

    return (
      <PartyMap
        sessionTitle={session.title}
        sessionStatus={session.status}
        currentParticipantId={participant.id}
        displayName={participant.displayName}
        avatar={participant.avatar}
        participants={participants}
        feedbacks={visibleFeedbacks}
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
        onCreateFeedback={handleCreateFeedback}
        onOpenAdmin={handleOpenAdmin}
      />
    );
  }

  return null;
}

export default App;
