"use client";

import { useRef, useState, type DragEvent } from "react";
import { MEDIA_MAX_BYTES, MEDIA_TYPES, uploadMedia } from "@/lib/upload-media";

type Props = {
  value: string;
  onChange: (url: string) => void;
  es: boolean;
};

const MB = Math.round(MEDIA_MAX_BYTES / (1024 * 1024));

/**
 * Owner-only cover image picker for a blog article: drop a file or pick one
 * (on phones the picker opens the camera roll), see the preview, replace or
 * remove it. The file goes to R2 through /api/media, which re-checks type and
 * size; the returned /media URL is set automatically. A link can still be
 * pasted in the details panel below.
 */
export function CoverPicker({ value, onChange, es }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  const send = async (file: File | null | undefined) => {
    if (!file) return;
    setError("");
    setBusy(true);
    const r = await uploadMedia(file);
    setBusy(false);
    if (r.error || !r.url) {
      const why =
        r.error === "type" || r.error === "unsupported_type"
          ? es ? "Formato no soportado (PNG, JPG, WebP, GIF o AVIF)." : "Unsupported format (PNG, JPG, WebP, GIF or AVIF)."
          : r.error === "size" || r.error === "too_large"
            ? es ? `La imagen pesa más de ${MB} MB.` : `The image is larger than ${MB} MB.`
            : r.error === "session"
              ? es ? "Tu sesión venció. Volvé a ingresar." : "Your session expired. Sign in again."
              : es ? `No se pudo subir la imagen (${r.error}).` : `Couldn't upload the image (${r.error}).`;
      setError(why);
      return;
    }
    onChange(r.url);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    void send(e.dataTransfer.files?.[0]);
  };

  const pickLabel = value ? (es ? "Reemplazar imagen" : "Replace image") : es ? "Subir imagen" : "Upload image";

  return (
    <div className="cover-picker" data-ie-toolbar="1">
      <div
        className={`cover-drop${over ? " is-over" : ""}${value ? " has-image" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        data-testid="cover-drop"
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={es ? "Vista previa de la portada" : "Cover preview"} className="cover-preview" />
        ) : (
          <span className="cover-hint">{busy ? (es ? "Subiendo…" : "Uploading…") : es ? "Arrastrá una imagen acá" : "Drop an image here"}</span>
        )}
      </div>
      <div className="cover-actions">
        <button type="button" className="cover-btn" onClick={() => input.current?.click()} disabled={busy} aria-busy={busy}>
          {busy ? (es ? "Subiendo…" : "Uploading…") : pickLabel}
        </button>
        {value ? (
          <button type="button" className="cover-btn is-quiet" onClick={() => onChange("")} disabled={busy}>
            {es ? "Quitar" : "Remove"}
          </button>
        ) : null}
      </div>
      <input
        ref={input}
        type="file"
        accept={MEDIA_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void send(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? <p className="cover-error" role="alert">{error}</p> : null}
    </div>
  );
}
