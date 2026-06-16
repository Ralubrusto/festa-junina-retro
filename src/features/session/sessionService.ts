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
} from "../../types/domain";

export async function signInParticipant(
  session: RetroSession,
  displayName: string,
  avatar: Avatar,
): Promise<Participant> {
  const credentials = auth.currentUser
    ? { user: auth.currentUser }
    : await signInAnonymously(auth);
  const participantRef = doc(
    db,
    "sessions",
    session.id,
    "participants",
    credentials.user.uid,
  );
  await ensureSession(session);

  const participantSnapshot = await getDoc(participantRef);

  if (participantSnapshot.exists()) {
    const savedParticipant = participantSnapshot.data();
    const participant: Participant = {
      id: credentials.user.uid,
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
    id: credentials.user.uid,
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
        };
      }),
    );
  });
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

    return;
  }

  await setDoc(
    sessionRef,
    {
      title: session.title,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
