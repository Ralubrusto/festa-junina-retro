import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email: string) => email.trim().toLowerCase())
  .filter(Boolean);

export type AdminAuthState = {
  email: string | null;
  isAdmin: boolean;
  isChecking: boolean;
};

export function subscribeToAdminAuth(
  onAdminAuthChange: (state: AdminAuthState) => void,
) {
  return onAuthStateChanged(auth, (user) => {
    const email = user?.email?.toLowerCase() ?? null;

    onAdminAuthChange({
      email,
      isAdmin: Boolean(email && adminEmails.includes(email)),
      isChecking: false,
    });
  });
}

export async function signInAdminWithGoogle() {
  const provider = new GoogleAuthProvider();

  await signInWithPopup(auth, provider);
}
