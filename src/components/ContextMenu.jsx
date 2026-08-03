import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MONO, pill } from "@daybreak/sdk";

const MENU_WIDTH = 236;
const EDGE = 12;

// Keeps the menu on screen. The design used fixed height guesses (400/280);
// measuring the rendered menu handles long widget menus and short board menus
// alike, and works when the window is small.
function useClampedPosition(x, y, deps) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight || 0;
    const w = ref.current?.offsetWidth || MENU_WIDTH;
    setPos({
      left: Math.max(EDGE, Math.min(x, window.innerWidth - w - EDGE)),
      top: Math.max(EDGE, Math.min(y, window.innerHeight - h - EDGE)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, ...deps]);

  return [ref, pos];
}

function MenuItem({ item, onClose }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
        item.run?.();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        width: "100%",
        padding: "8px 14px",
        fontSize: "13px",
        cursor: "pointer",
        textAlign: "left",
        border: 0,
        background: hovered ? "var(--panel2)" : "transparent",
        color: item.danger ? "var(--danger)" : "var(--fg)",
      }}
    >
      <span>{item.label}</span>
      {item.hint ? (
        <span style={{ fontFamily: MONO, fontSize: "10px", color: "var(--faint)" }}>
          {item.hint}
        </span>
      ) : null}
    </button>
  );
}

function ContextMenu({ menu, title, items, closing, onClose }) {
  const [ref, pos] = useClampedPosition(menu.x, menu.y, [items.length]);

  useEffect(() => {
    const onScroll = () => onClose();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        // Inert while the menu fades out, so a quick second click lands on the
        // page rather than on a catcher that is on its way out.
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          pointerEvents: closing ? "none" : undefined,
        }}
      />
      <div
        ref={ref}
        role="menu"
        aria-label={title}
        style={{
          position: "fixed",
          left: pos.left,
          top: pos.top,
          zIndex: 81,
          width: MENU_WIDTH,
          padding: "4px 0 6px",
          borderRadius: "14px",
          background: "var(--sheet)",
          border: "1px solid var(--line)",
          backdropFilter: "var(--blur-panel)",
          boxShadow: "0 24px 70px rgba(0,0,0,.45)",
          transformOrigin: "top left",
          animation: closing
            ? "db-pop-out .12s ease both"
            : "db-menu .12s ease both",
          pointerEvents: closing ? "none" : undefined,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "9px 14px 8px",
            fontFamily: MONO,
            fontSize: "10px",
            letterSpacing: ".13em",
            textTransform: "uppercase",
            color: "var(--faint)",
          }}
        >
          {title}
        </div>

        {items.map((item, i) => {
          if (item.type === "separator") {
            return (
              <div
                key={`sep-${i}`}
                style={{ height: 1, background: "var(--line)", margin: "6px 0" }}
              />
            );
          }
          if (item.type === "sizes") {
            return (
              <div
                key="sizes"
                // Wraps: widgets like Google Apps offer six sizes, which do not
                // fit the menu width on one line.
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "5px",
                  padding: "4px 10px 8px",
                }}
              >
                {item.sizes.map((s) => {
                  const active = item.current[0] === s[0] && item.current[1] === s[1];
                  return (
                    <button
                      key={s.join("x")}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        item.onPick(s);
                      }}
                      style={pill(active, {
                        fontFamily: MONO,
                        fontSize: "10px",
                        padding: "5px 9px",
                      })}
                    >
                      {s.join("×")}
                    </button>
                  );
                })}
              </div>
            );
          }
          return <MenuItem key={item.label} item={item} onClose={onClose} />;
        })}
      </div>
    </>
  );
}

export default ContextMenu;
