import { useState } from "react";
import type { FormEvent } from "react";
import { Sparkles } from "lucide-react";

type EntryScreenProps = {
  sessionTitle: string;
  isLoading: boolean;
  errorMessage: string | null;
  onSubmit: (displayName: string) => void;
};

export function EntryScreen({
  sessionTitle,
  isLoading,
  errorMessage,
  onSubmit,
}: EntryScreenProps) {
  const [displayName, setDisplayName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      return;
    }

    onSubmit(trimmedName);
  }

  return (
    <main className="screen entry-screen">
      <section className="intro">
        <div className="intro-badge">
          <Sparkles size={18} />
          Retro junina
        </div>
        <h1>{sessionTitle}</h1>
        <p>
          Entre na festa, monte seu personagem e deixe feedbacks para guiar a
          conversa do time.
        </p>
      </section>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <label htmlFor="displayName">Seu nome</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Ex.: Ana"
          autoComplete="name"
          disabled={isLoading}
        />
        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Entrando..." : "Entrar na festa"}
        </button>
      </form>
    </main>
  );
}
