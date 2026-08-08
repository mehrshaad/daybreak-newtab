import { useEffect, useState } from "react";
import {
  hasOrigin,
  hasPermissionsApi,
  MONO,
  originOf,
  requestOrigin,
  useWidgetLocal,
} from "@daybreak/sdk";
import { groupEvents, isToday, relativeLabel } from "./agenda";
import { parseIcs } from "./ics";

const PROVIDERS = [
  {
    name: "Google Calendar",
    steps: [
      'Settings → "Settings for my calendars"',
      'Pick the calendar → "Integrate calendar"',
      'Copy "Secret address in iCal format"',
    ],
  },
  {
    name: "Outlook / Microsoft 365",
    steps: ["Settings → Calendar → Shared calendars", "Publish the calendar", "Copy the ICS link"],
  },
  {
    name: "Apple iCloud",
    steps: [
      "Calendar app → share the calendar",
      'Turn on "Public Calendar"',
      "Copy the link (swap webcal:// for https://)",
    ],
  },
];

// chrome.storage round-trips through JSON, so a cached event's start/end
// come back as strings, not Date instances. new Date() on an existing Date
// just clones it, so this is safe to apply to live results too.
function reviveDates(events) {
  return events?.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) })) || null;
}

function EmptyState({ onSave }) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const url = draft.trim();
    if (!url) return;
    setSaving(true);
    const ok = await onSave(url);
    setSaving(false);
    // The address itself is never kept in state or shown again once saved —
    // it is a credential, not a label.
    if (ok) setDraft("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        fontSize: 12,
      }}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", gap: 6, flex: "none" }}
      >
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your calendar's private iCal link"
          aria-label="Calendar iCal address"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "7px 10px",
            borderRadius: 8,
            background: "var(--panel2)",
            border: "1px solid var(--line)",
            outline: "none",
            fontSize: 12,
            color: "var(--fg)",
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "7px 14px",
            borderRadius: 8,
            border: 0,
            background: "var(--accent)",
            color: "var(--onAccent)",
            cursor: saving ? "default" : "pointer",
            fontSize: 12,
            flex: "none",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "…" : "Add"}
        </button>
      </form>
      <div style={{ color: "var(--faint)", lineHeight: 1.5, flex: "none" }}>
        This link is private — anyone who has it can read your calendar. It is
        saved only in your own settings and used only to fetch your events.
      </div>
      {PROVIDERS.map((p) => (
        <div key={p.name} style={{ flex: "none" }}>
          <div style={{ fontWeight: 500, color: "var(--dim)", marginBottom: 3 }}>{p.name}</div>
          <ol style={{ margin: 0, paddingLeft: 16, color: "var(--faint)", lineHeight: 1.6 }}>
            {p.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

function EventRow({ event, now }) {
  const time = event.allDay
    ? "All day"
    : event.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const rel = !event.allDay ? relativeLabel(event.start, now) : null;

  return (
    <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
      <span
        style={{ fontFamily: MONO, fontSize: 11, color: "var(--faint)", flex: "none", width: 64 }}
      >
        {time}
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {event.title}
        </div>
        {event.location || rel ? (
          <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 1 }}>
            {[rel, event.location].filter(Boolean).join(" · ")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Calendar({ id, config, setConfig, refreshKey, size, toast }) {
  const icsUrl = config.icsUrl;
  const [cached, setCached] = useWidgetLocal(id, "events", null);
  const [status, setStatus] = useState(icsUrl ? "loading" : "empty");
  const [live, setLive] = useState(null);
  const tall = (size?.[1] ?? 3) >= 3;
  const limit = tall ? 8 : 4;

  const saveUrl = async (url) => {
    let origin;
    try {
      origin = originOf(url);
    } catch {
      toast?.("That doesn't look like a web address");
      return false;
    }
    // No permissions API in this context (e.g. local dev) — nothing to
    // request, so save anyway and let the fetch below surface its own
    // error if the address turns out to be unreachable.
    if (!hasPermissionsApi()) {
      setConfig({ icsUrl: url });
      return true;
    }
    // Must run before any other await, in the same click, or Chrome drops
    // the permission prompt for lacking a user gesture.
    const granted = await requestOrigin(origin);
    if (!granted) {
      toast?.("Permission needed to fetch that calendar");
      return false;
    }
    setConfig({ icsUrl: url });
    return true;
  };

  useEffect(() => {
    if (!icsUrl) {
      setStatus("empty");
      return undefined;
    }
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    const run = async () => {
      const granted = await hasOrigin(originOf(icsUrl));
      if (!active) return;
      if (!granted) {
        setStatus("nopermission");
        return;
      }
      try {
        const text = await fetch(icsUrl).then((r) => r.text());
        const events = parseIcs(text);
        if (!active) return;
        setLive(events);
        setCached(events);
        setStatus("ok");
      } catch {
        if (active) setStatus("blocked");
      }
    };
    run();

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icsUrl, refreshKey]);

  if (status === "empty") {
    return <EmptyState onSave={saveUrl} />;
  }

  const events = reviveDates(live || cached);

  if (!events) {
    const message =
      {
        nopermission: "Needs permission — open settings to grant it.",
        blocked: "This calendar does not allow browser access.",
      }[status] || "Loading…";
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          color: "var(--faint)",
          textAlign: "center",
          padding: "0 10px",
        }}
      >
        {message}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          color: "var(--faint)",
        }}
      >
        Nothing in the next two weeks.
      </div>
    );
  }

  const now = new Date();
  const shown = groupEvents(events).slice(0, limit);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
        minHeight: 0,
        overflow: "auto",
      }}
    >
      {shown.map((event, i) => {
        const thisToday = isToday(event.start, now);
        // A label the moment the list enters or leaves today, so "today"
        // reads as a distinct group from "later" without repeating on every
        // row.
        const previousToday = i > 0 && isToday(shown[i - 1].start, now);
        const isBoundary = i === 0 || previousToday !== thisToday;
        const label = isBoundary ? (thisToday ? "Today" : "Upcoming") : null;
        return (
          <div key={`${event.title}-${event.start.getTime()}-${i}`}>
            {label ? (
              <div
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--faint)",
                  margin: i === 0 ? "0 0 8px" : "2px 0 8px",
                }}
              >
                {label}
              </div>
            ) : null}
            <EventRow event={event} now={now} />
          </div>
        );
      })}
      {status === "blocked" ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          This calendar does not allow browser access — showing the last events.
        </div>
      ) : null}
    </div>
  );
}

export default Calendar;
