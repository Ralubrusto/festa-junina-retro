import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import type {
  Avatar,
  FeedbackItem,
  Participant,
  RetroSession,
  SessionStatus,
} from "../../types/domain";

export async function ensureAnonymousAuth() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credentials = await signInAnonymously(auth);

  return credentials.user;
}

export async function signInParticipant(
  session: RetroSession,
  displayName: string,
  avatar: Avatar,
): Promise<Participant> {
  const user = await ensureAnonymousAuth();
  const participantRef = doc(
    db,
    "sessions",
    session.id,
    "participants",
    user.uid,
  );
  await ensureSession(session);

  const participantSnapshot = await getDoc(participantRef);

  if (participantSnapshot.exists()) {
    const savedParticipant = participantSnapshot.data();
    const participant: Participant = {
      id: user.uid,
      displayName: savedParticipant.displayName ?? displayName,
      avatar: savedParticipant.avatar ?? avatar,
    };

    await setDoc(
      participantRef,
      {
        displayName,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      ...participant,
      displayName,
    };
  }

  const participant: Participant = {
    id: user.uid,
    displayName,
    avatar,
  };

  await setDoc(
    participantRef,
    {
      displayName: participant.displayName,
      avatar: participant.avatar,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return participant;
}

export async function updateParticipantAvatar(
  session: RetroSession,
  participant: Participant,
) {
  await setDoc(
    doc(db, "sessions", session.id, "participants", participant.id),
    {
      avatar: participant.avatar,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createFeedback(
  session: RetroSession,
  participant: Participant,
  category: FeedbackItem["category"],
  text: string,
) {
  await addDoc(collection(db, "sessions", session.id, "feedbacks"), {
    category,
    text,
    authorId: participant.id,
    authorName: participant.displayName,
    createdAt: serverTimestamp(),
    createdAtLabel: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    hiddenByAdmin: false,
  });
}

export function subscribeToFeedbacks(
  session: RetroSession,
  onFeedbacksChange: (feedbacks: FeedbackItem[]) => void,
): Unsubscribe {
  const feedbacksQuery = query(
    collection(db, "sessions", session.id, "feedbacks"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(feedbacksQuery, (snapshot) => {
    onFeedbacksChange(
      snapshot.docs.map((feedbackDoc) => {
        const data = feedbackDoc.data();

        return {
          id: feedbackDoc.id,
          category: data.category,
          text: data.text,
          authorName: data.authorName,
          createdAt: data.createdAtLabel ?? "",
          hiddenByAdmin: data.hiddenByAdmin ?? false,
        };
      }),
    );
  });
}

export function subscribeToSession(
  session: RetroSession,
  onSessionChange: (session: RetroSession) => void,
): Unsubscribe {
  void ensureSession(session);

  return onSnapshot(doc(db, "sessions", session.id), (snapshot) => {
    const data = snapshot.data();

    onSessionChange({
      id: session.id,
      title: data?.title ?? session.title,
      status: data?.status ?? session.status,
    });
  });
}

export function subscribeToParticipants(
  session: RetroSession,
  onParticipantsChange: (participants: Participant[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, "sessions", session.id, "participants"),
    (snapshot) => {
      const participants = snapshot.docs
        .map((participantDoc) => {
          const data = participantDoc.data();

          return {
            id: participantDoc.id,
            displayName: data.displayName,
            avatar: data.avatar,
          };
        })
        .filter((participant): participant is Participant =>
          Boolean(participant.displayName && participant.avatar),
        )
        .sort((firstParticipant, secondParticipant) =>
          firstParticipant.displayName.localeCompare(
            secondParticipant.displayName,
            "pt-BR",
          ),
        );

      onParticipantsChange(participants);
    },
  );
}

export async function updateFeedbackVisibility(
  session: RetroSession,
  feedbackId: string,
  hiddenByAdmin: boolean,
) {
  await setDoc(
    doc(db, "sessions", session.id, "feedbacks", feedbackId),
    {
      hiddenByAdmin,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateSessionStatus(
  session: RetroSession,
  status: SessionStatus,
) {
  await setDoc(
    doc(db, "sessions", session.id),
    {
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function ensureSession(session: RetroSession) {
  const sessionRef = doc(db, "sessions", session.id);
  const sessionSnapshot = await getDoc(sessionRef);

  if (!sessionSnapshot.exists()) {
    await setDoc(sessionRef, {
      title: session.title,
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

  }
}
