import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LuArrowUp,
  LuCheck,
  LuCopy,
  LuImage,
  LuLayers,
  LuMoon,
  LuPencil,
  LuPlus,
  LuRefreshCw,
  LuRotateCcw,
  LuSave,
  LuScan,
  LuSettings,
  LuSun,
  LuTrash2,
} from "react-icons/lu";
import { MenuRow, MONO, clampToViewport, pageZoomFactor } from "@daybreak/sdk";
import { Pill } from "./primitives";

const MENU_WIDTH = 236;

// The name a menu item asks for, resolved to a glyph.
//
// The map lives here rather than in core/menus.js so that module stays plain
// data with no React in it — and so an unknown name is a row with no icon
// rather than a crash in the middle of opening a menu.
const ICONS = {
  add: LuPlus,
  edit: LuPencil,
  done: LuCheck,
  layers: LuLayers,
  save: LuSave,
  reset: LuRotateCcw,
  background: LuImage,
  light: LuSun,
  dark: LuMoon,
  settings: LuSettings,
  focus: LuScan,
  refresh: LuRefreshCw,
  duplicate: LuCopy,
  top: LuArrowUp,
  remove: LuTrash2,
};

// A fixed column for the glyph whether or not the row has one, so the labels
// line up down the menu instead of stepping in and out.
const ICON_SLOT = { width: 15, flex: "none", display: "grid", placeItems: "center" };

// Keeps the menu on screen. The design used fixed height guesses (400/280);
// measuring the rendered menu handles long widget menus and short board menus
// alike, and works when the window is small.
function useClampedPosition(x, y, deps) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const h = ref.current?.offsetHeight || 0;
    const w = ref.current?.offsetWidth || MENU_WIDTH;
    // x and y are a pointer event's clientX/clientY, which are visual pixels;
    // `left` and `top` on this menu are read as layout pixels. Identical until
    // a page zoom is set, and off by the zoom afterwards — the menu opened
    // above and left of the pointer at 90%. See zoom.js.
    const zoom = pageZoomFactor();
    setPos(clampToViewport(x / zoom, y / zoom, w, h, 12, zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, ...deps]);

  return [ref, pos];
}

function MenuItem({ item, onClose, hint = false }) {
  // The shared row (and with it the hover highlight and its fade) is the SDK's
  // now, so this menu and the two in the toolbar cannot drift apart again.
  // `hint` is the tour pointing at a row with no pointer near it.
  const Icon = ICONS[item.icon];
  return (
    <MenuRow
      role="menuitem"
      hint={hint}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
        item.run?.();
      }}
      style={{
        justifyContent: "space-between",
        gap: "12px",
        padding: "8px 14px",
        color: item.danger ? "var(--danger)" : "var(--fg)",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={ICON_SLOT} aria-hidden>
          {Icon ? <Icon size={13} style={{ opacity: item.danger ? 1 : 0.75 }} /> : null}
        </span>
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.label}
        </span>
      </span>
      {item.hint ? (
        <span
          style={{
            fontFamily: MONO,
            fontSize: "10px",
            color: "var(--faint)",
            flex: "none",
          }}
        >
          {item.hint}
        </span>
      ) : null}
    </MenuRow>
  );
}

function ContextMenu({ menu, title, items, closing, onClose, hintLabel }) {
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
        data-tour="tile-menu"
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
                    <Pill
                      key={s.join("x")}
                      active={active}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        item.onPick(s);
                      }}
                      style={{
                        fontFamily: MONO,
                        fontSize: "10px",
                        padding: "5px 9px",
                      }}
                    >
                      {s.join("×")}
                    </Pill>
                  );
                })}
              </div>
            );
          }
          return (
            <MenuItem
              key={item.label}
              item={item}
              onClose={onClose}
              hint={!!hintLabel && item.label === hintLabel}
            />
          );
        })}
      </div>
    </>
  );
}

export default ContextMenu;
