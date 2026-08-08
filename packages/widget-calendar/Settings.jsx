import { useState } from "react";
import { LuX } from "react-icons/lu";
import {
  dropOrigin,
  hasPermissionsApi,
  IconTile,
  originOf,
  requestOrigin,
  Tooltip,
  uid,
  useTooltip,
} from "@daybreak/sdk";
import { PROVIDER_ICON_NAME, PROVIDER_LABEL, providerFor, resolveCalendars } from "./calendars";

// Its own component so each row's remove-button tooltip gets its own hover
// state, independent of the others.
function CalendarRow({ label, provider, onRemove }) {
  const tip = useTooltip(`Remove ${label}`);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 8px",
        borderRadius: 8,
        transition: "background .15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--panel2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <IconTile name={PROVIDER_ICON_NAME[provider] || "Calendar"} size={22} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--fg)" }}>{label}</div>
      <button
        ref={tip.anchorRef}
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        style={{
          display: "grid",
          placeItems: "center",
          width: 24,
          height: 24,
          padding: 0,
          border: 0,
          borderRadius: 999,
          background: "transparent",
          color: "var(--faint)",
          cursor: "pointer",
          transition: "background .15s ease, color .15s ease",
        }}
        onMouseEnter={(e) => {
          tip.anchorProps.onMouseEnter?.();
          e.currentTarget.style.background = "var(--panel2)";
          e.currentTarget.style.color = "var(--danger)";
        }}
        onMouseLeave={(e) => {
          tip.anchorProps.onMouseLeave?.();
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--faint)";
        }}
      >
        <LuX size={13} />
      </button>
      <Tooltip {...tip} />
    </div>
  );
}

function CalendarSettings({ config, setConfig, toast }) {
  const calendars = resolveCalendars(config);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    const url = draft.trim();
    if (!url) return;
    let origin;
    try {
      origin = originOf(url);
    } catch {
      toast?.("That doesn't look like a web address");
      return;
    }
    setSaving(true);
    if (hasPermissionsApi()) {
      // Must run before any other await, in the same click, or Chrome drops
      // the permission prompt for lacking a user gesture.
      const granted = await requestOrigin(origin);
      if (!granted) {
        setSaving(false);
        toast?.("Permission needed to fetch that calendar");
        return;
      }
    }
    setConfig({
      calendars: [...calendars, { id: uid(), url, provider: providerFor(url) }],
      // The list is the source of truth from here on — drop the legacy
      // single-calendar field so resolveCalendars never has to reconcile
      // both shapes for this config again.
      icsUrl: null,
    });
    setSaving(false);
    setDraft("");
  };

  const remove = (target) => {
    const next = calendars.filter((c) => c.id !== target.id);
    try {
      const origin = originOf(target.url);
      const stillNeeded = next.some((c) => originOf(c.url) === origin);
      if (!stillNeeded) dropOrigin(origin);
    } catch {
      /* address no longer parses; nothing to release */
    }
    setConfig({ calendars: next, icsUrl: null });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {calendars.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {calendars.map((cal) => (
            <CalendarRow
              key={cal.id}
              label={PROVIDER_LABEL[cal.provider] || PROVIDER_LABEL.other}
              provider={cal.provider}
              onRemove={() => remove(cal)}
            />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--faint)" }}>
          No calendars connected yet — paste a link on the tile itself.
        </div>
      )}

      <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add another calendar's iCal link"
          aria-label="Calendar iCal address"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            outline: "none",
            fontSize: 13,
            color: "var(--fg)",
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            alignSelf: "flex-start",
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 12,
            cursor: saving ? "default" : "pointer",
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            color: "var(--fg)",
            opacity: saving ? 0.7 : 1,
            transition: "background .15s ease, border-color .15s ease",
          }}
        >
          {saving ? "…" : "Add calendar"}
        </button>
      </form>
    </div>
  );
}

export default CalendarSettings;
