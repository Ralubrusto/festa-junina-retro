import { useEffect, useState } from "react";
import { AvatarSetup } from "../features/avatar/AvatarSetup";
import { PartyMap } from "../features/party/PartyMap";
import { EntryScreen } from "../features/session/EntryScreen";
import {
  createFeedback,
  signInParticipant,
  subscribeToFeedbacks,
  updateParticipantAvatar,
} from "../features/session/sessionService";
import { getInitialSession } from "../features/session/sessionRouting";
import type {
  AppStep,
  Avatar,
  FeedbackItem,
  Participant,
  RetroStation,
} from "../types/domain";

const defaultAvatar: Avatar = {
  outfit: "Camisa xadrez",
  accessory: "Chapeu de palha",
  color: "#d1495b",
};

function App() {
  const [session] = useState(getInitialSession);
  const [step, setStep] = useState<AppStep>("entry");
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [avatar, setAvatar] = useState<Avatar>(defaultAvatar);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [selectedStation, setSelectedStation] = useState<RetroStation | null>(
    null,
  );
  const [isEntering, setIsEntering] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToFeedbacks(session, setFeedbacks);

    return () => unsubscribe();
  }, [session]);

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
    return (
      <PartyMap
        sessionTitle={session.title}
        displayName={participant.displayName}
        avatar={participant.avatar}
        feedbacks={feedbacks}
        selectedStation={selectedStation}
        onSelectStation={setSelectedStation}
        onCreateFeedback={handleCreateFeedback}
      />
    );
  }

  return null;
}

export default App;
