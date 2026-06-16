import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import type { Avatar, FeedbackItem, Participant } from "../../types/domain";

const DEFAULT_SESSION_ID = "demo-sprint";

export async function signInParticipant(
  displayName: string,
  avatar: Avatar,
): Promise<Participant> {
  const credentials = auth.currentUser
    ? { user: auth.currentUser }
    : await signInAnonymously(auth);

  const participant: Participant = {
    id: credentials.user.uid,
    displayName,
    avatar,
  };

  await ensureDefaultSession();
  await setDoc(
    doc(db, "sessions", DEFAULT_SESSION_ID, "participants", participant.id),
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

export async function updateParticipantAvatar(participant: Participant) {
  await setDoc(
    doc(db, "sessions", DEFAULT_SESSION_ID, "participants", participant.id),
    {
      avatar: participant.avatar,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createFeedback(
  participant: Participant,
  category: FeedbackItem["category"],
  text: string,
) {
  await addDoc(collection(db, "sessions", DEFAULT_SESSION_ID, "feedbacks"), {
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
  onFeedbacksChange: (feedbacks: FeedbackItem[]) => void,
): Unsubscribe {
  const feedbacksQuery = query(
    collection(db, "sessions", DEFAULT_SESSION_ID, "feedbacks"),
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

async function ensureDefaultSession() {
  await setDoc(
    doc(db, "sessions", DEFAULT_SESSION_ID),
    {
      title: "Demo sprint",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
