/**
 * Static ambient background.
 * Rothko colour fields: two feathered, glowing rectangles that breathe very slowly
 * (opacity/brightness only, off under prefers-reduced-motion).
 */
export function CosmicBg() {
  return (
    <div
      aria-hidden
      className="cosmic-root pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="cosmic-base absolute inset-0" />
      <div className="cosmic-grid absolute inset-0" />
      <div className="rothko-field rothko-field-a absolute" />
      <div className="rothko-field rothko-field-b absolute" />
      <div className="cosmic-vignette absolute inset-0" />
    </div>
  );
}
