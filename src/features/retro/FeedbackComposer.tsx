import { useState } from "react";
import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { RetroStation } from "../../types/domain";

type FeedbackComposerProps = {
  station: RetroStation;
  onClose: () => void;
  onSubmit: (text: string) => void;
};

export function FeedbackComposer({
  station,
  onClose,
  onSubmit,
}: FeedbackComposerProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    onSubmit(trimmedText);
    setText("");
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true">
        <button
          type="button"
          className="icon-button"
          aria-label="Fechar"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <p className="eyebrow">{station.title}</p>
        <h2>{station.cta}</h2>
        <p>{station.description}</p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escreva aqui..."
            rows={5}
          />
          <button type="submit">Salvar feedback</button>
        </form>
      </section>
    </div>
  );
}
