import { usePresence } from "../usePresence";

// Fades and scales a group in, and — unlike a bare ternary — back out again.
//
// For chrome that only exists in a mode: a tile's resize and remove buttons, a
// row's reorder grip. Relies on the host's db-menu / db-pop-out keyframes, the
// same way widgets rely on its CSS custom properties.
export const APPEAR_MS = 180;

function Appear({ open, style, children }) {
  const [present, closing] = usePresence(open, APPEAR_MS);
  if (!present) return null;
  return (
    <div
      style={{
        ...style,
        animation: closing
          ? `db-pop-out ${APPEAR_MS}ms ease both`
          : `db-menu ${APPEAR_MS}ms cubic-bezier(.2,.8,.2,1) both`,
      }}
    >
      {children}
    </div>
  );
}

export default Appear;
