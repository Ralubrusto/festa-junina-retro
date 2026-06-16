import { Check } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { Avatar } from "../../types/domain";

type AvatarSetupProps = {
  displayName: string;
  avatar: Avatar;
  isSaving: boolean;
  errorMessage: string | null;
  onChange: (avatar: Avatar) => void;
  onConfirm: () => void;
};

const colors = ["#d1495b", "#edae49", "#00798c", "#30638e"];
const outfits = ["Camisa xadrez", "Vestido junino", "Macacao", "Jaqueta"];
const accessories = ["Chapeu de palha", "Lenco", "Bigode", "Flor"];

export function AvatarSetup({
  displayName,
  avatar,
  isSaving,
  errorMessage,
  onChange,
  onConfirm,
}: AvatarSetupProps) {
  return (
    <main className="screen avatar-screen">
      <section className="panel avatar-preview">
        <div
          className="avatar-person"
          style={{ "--avatar-color": avatar.color } as CSSProperties}
        >
          <span className="avatar-head" />
          <span className="avatar-body" />
        </div>
        <div>
          <p className="eyebrow">Preparando o personagem</p>
          <h1>{displayName}</h1>
          <p>
            {avatar.outfit} com {avatar.accessory.toLowerCase()}.
          </p>
        </div>
      </section>

      <section className="panel setup-panel">
        <OptionGroup title="Cor principal">
          <div className="swatches">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className="swatch"
                style={{ backgroundColor: color }}
                aria-label={`Escolher cor ${color}`}
                disabled={isSaving}
                onClick={() => onChange({ ...avatar, color })}
              >
                {avatar.color === color ? <Check size={18} /> : null}
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup title="Roupa">
          <div className="segmented-grid">
            {outfits.map((outfit) => (
              <button
                key={outfit}
                type="button"
                className={outfit === avatar.outfit ? "selected" : ""}
                disabled={isSaving}
                onClick={() => onChange({ ...avatar, outfit })}
              >
                {outfit}
              </button>
            ))}
          </div>
        </OptionGroup>

        <OptionGroup title="Acessorio">
          <div className="segmented-grid">
            {accessories.map((accessory) => (
              <button
                key={accessory}
                type="button"
                className={accessory === avatar.accessory ? "selected" : ""}
                disabled={isSaving}
                onClick={() => onChange({ ...avatar, accessory })}
              >
                {accessory}
              </button>
            ))}
          </div>
        </OptionGroup>

        {errorMessage ? <p className="error-message">{errorMessage}</p> : null}
        <button
          type="button"
          className="primary-action"
          disabled={isSaving}
          onClick={onConfirm}
        >
          {isSaving ? "Salvando..." : "Ir para a festa"}
        </button>
      </section>
    </main>
  );
}

type OptionGroupProps = {
  title: string;
  children: ReactNode;
};

function OptionGroup({ title, children }: OptionGroupProps) {
  return (
    <div className="option-group">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
