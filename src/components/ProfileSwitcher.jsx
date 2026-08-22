import { useCallback, useEffect, useRef, useState } from "react";
import { LuCheck, LuSettings2 } from "react-icons/lu";
import { MONO, Tooltip, useRovingMenu, useTooltip } from "@daybreak/sdk";
import { useSettings } from "../core/settingsContext";
import { MAX_PROFILES } from "../core/profiles";

// The toolbar's profile chip.
//
// Only rendered once there is more than one profile: a single-profile install is
// the overwhelming majority and it should not be paying attention to a switcher
// for a thing it does not have. Managing them lives in Settings; this is purely
// the fast way between boards, which is the part worth a permanent place in the
// bar.
//
// It sits where the wordmark used to, and that is the point. The bar's left end
// held a wordmark and a clock — the wordmark decorative, the clock duplicating
// a clock widget — while the one piece of state a person needs to see at a
// glance, which board they are looking at, had nowhere to live.
function ProfileSwitcher({ compact, onManage }) {
  const { profiles, activeProfileId, switchProfile } = useSettings();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const list = profiles?.list || [];
  const active = list.find((p) => p.id === activeProfileId) || list[0];
  const tip = useTooltip(open ? null : `Profile: ${active?.name || ""}`);

  const close = useCallback((returnFocus) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Both roles: the profiles are radios and "manage" is a plain item, and with
  // the default selector the arrows stopped short of it — the last row in the
  // menu would have been mouse-only.
  const onMenuKeyDown = useRovingMenu(menuRef, {
    open,
    onClose: close,
    itemSelector: "[role=menuitemradio], [role=menuitem]",
  });

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  if (list.length < 2 || !active) return null;

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", minWidth: 0 }}>
      <button
        ref={(el) => {
          buttonRef.current = el;
          tip.anchorRef.current = el;
        }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Profile: ${active.name}. Switch profile`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          minWidth: 0,
          padding: compact ? "5px 7px" : "5px 11px 5px 8px",
          borderRadius: 999,
          cursor: "pointer",
          background: open ? "var(--panel2)" : "var(--panel)",
          border: "1px solid var(--line)",
          color: "var(--fg)",
          transition: "background .18s ease, border-color .18s ease",
        }}
        {...tip.anchorProps}
      >
        <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1, flex: "none" }}>
          {active.emoji}
        </span>
        {/* The name goes before the bar starts dropping anything else: at that
            width the emoji alone still identifies the board, and it is the
            cheapest thing here to give up. */}
        {compact ? null : (
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--dim)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {active.name}
          </span>
        )}
      </button>
      <Tooltip {...tip} />

      {open ? (
        <div
          role="menu"
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
          aria-label="Profiles"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            zIndex: 60,
            width: 210,
            padding: "5px 0",
            borderRadius: 12,
            background: "var(--sheet)",
            border: "1px solid var(--line)",
            backdropFilter: "var(--blur-panel)",
            boxShadow: "0 20px 50px rgba(0,0,0,.4)",
            animation: "db-menu .12s ease both",
          }}
        >
          {list.map((profile) => {
            const current = profile.id === activeProfileId;
            return (
              <button
                key={profile.id}
                type="button"
                role="menuitemradio"
                aria-checked={current}
                tabIndex={-1}
                onClick={() => {
                  close(false);
                  switchProfile(profile.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "8px 12px",
                  border: 0,
                  background: current ? "var(--accentSoft)" : "transparent",
                  color: current ? "var(--accent)" : "var(--fg)",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1, flex: "none" }}>
                  {profile.emoji}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {profile.name}
                </span>
                {/* A tick on the current one as well as the tinted row: the
                    tint alone is a colour difference, and the accent can be
                    any of sixteen. */}
                {current ? <LuCheck size={13} aria-hidden="true" /> : null}
              </button>
            );
          })}

          <div style={{ height: 1, background: "var(--line)", margin: "5px 0" }} />

          {/* Adding and deleting live in Settings rather than here. This menu is
              for the switch, which is the frequent act; a menu that also
              created things would put a permanent, rarely-wanted button next to
              the one people actually came for. */}
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close(false);
              onManage?.();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 12px",
              border: 0,
              background: "transparent",
              color: "var(--dim)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <LuSettings2 size={13} aria-hidden="true" />
            {list.length >= MAX_PROFILES ? "Manage profiles" : "Add or manage profiles"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileSwitcher;
