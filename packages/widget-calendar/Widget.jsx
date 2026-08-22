import { useEffect, useMemo, useState } from "react";
import {
  hasOrigin,
  hasPermissionsApi,
  MONO,
  originOf,
  requestOrigin,
  requestOrigins,
  uid,
  useWidgetLocal,
} from "@daybreak/sdk";
import { addMonths, formatDate, formatHijri, formatJalali } from "@daybreak/sdk";
import { groupEvents, isToday, relativeLabel } from "./agenda";
import { holidaysOn, HOLIDAY_SOURCE_YEAR } from "./holidays";
import MonthView from "./MonthView";
import { providerFor, resolveCalendars } from "./calendars";
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
        overflowY: "auto",
        overflowX: "hidden",
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
            transition: "opacity .15s ease",
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            if (!saving) e.currentTarget.style.opacity = "1";
          }}
        >
          {saving ? "…" : "Add"}
        </button>
      </form>
      <div style={{ color: "var(--faint)", lineHeight: 1.5, flex: "none" }}>
        This link is private — anyone who has it can read your calendar. It is
        saved only in your own settings and used only to fetch your events.
        Add more calendars any time from Widget settings.
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

function EventRow({ event, now, hour24 }) {
  const time = event.allDay
    ? "All day"
    : event.start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: !hour24 });
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

// The month grid, plus whatever is on the day you picked out of it.
//
// The split is deliberate: the grid answers "what does this month look like"
// and the panel under it answers "what is on this day", and a widget three
// columns wide cannot do both in one surface. The panel is what makes the grid
// worth clicking.
function MonthPane({
  events,
  monthOffset,
  onMove,
  selected,
  onSelect,
  alternate,
  weekStart,
  weekendDays,
  showHolidays,
  hour24,
  hasCalendars,
  size,
}) {
  const today = new Date();
  const { year, month } = addMonths(today.getFullYear(), today.getMonth(), monthOffset);

  // One pass over the events rather than a filter per cell: the grid asks about
  // 42 days and a fortnight of events is small, so indexing it once is both
  // faster and the only way the dot and the day panel can agree.
  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events || []) {
      const key = formatDate(event.start);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [events]);

  const onSelectedDay = useMemo(
    () => (events || []).filter((e) => formatDate(e.start) === selected),
    [events, selected]
  );

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);

  const holidays = showHolidays ? holidaysOn(selectedDate) : [];
  const tall = (size?.[1] ?? 3) >= 4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 0 }}>
      <MonthView
        year={year}
        month={month}
        selected={selected}
        onSelect={onSelect}
        onMove={onMove}
        alternate={alternate}
        weekStart={weekStart}
        weekendDays={weekendDays}
        showHolidays={showHolidays}
        eventsByDay={eventsByDay}
      />

      <div
        // Takes what its content needs and no more; the grid above absorbs the
        // rest. Sized the other way round, a tall tile left the panel mostly
        // empty with the grid still cramped at the top.
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: "none",
          maxHeight: "45%",
          overflowY: "auto",
          overflowX: "hidden",
          borderTop: "1px solid var(--line)",
          paddingTop: 7,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "var(--faint)",
              flex: "none",
            }}
          >
            {formatDate(today) === selected
              ? "Today"
              : selectedDate.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
          </span>
          {alternate !== "none" ? (
            <span style={{ fontFamily: MONO, fontSize: 10, color: "var(--faint)", flex: 1, minWidth: 0 }}>
              {alternate === "jalali"
                ? formatJalali(selectedDate)
                : formatHijri(selectedDate)}
            </span>
          ) : null}
        </div>

        {holidays.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {holidays.map((h) => (
              <div key={h.name} style={{ fontSize: 12, color: "var(--danger)", lineHeight: 1.4 }}>
                {h.name}
                {/* Said on the day itself rather than buried in a footnote: a
                    religious holiday's official date in Iran follows a sighting,
                    so a computed one can be a day either side and the person
                    reading it should know which kind they are looking at. */}
                {h.kind === "lunar" ? (
                  <span style={{ color: "var(--faint)" }}> · computed, may move a day</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {onSelectedDay.length ? (
          onSelectedDay.map((event, i) => (
            <EventRow
              key={`${event.title}-${event.start.getTime()}-${i}`}
              event={event}
              now={today}
              hour24={hour24}
            />
          ))
        ) : hasCalendars ? (
          <div style={{ fontSize: 12, color: "var(--faint)" }}>
            {holidays.length ? "Nothing else on." : "Nothing on."}
          </div>
        ) : (
          // No calendar connected. A quiet line rather than the form, which is
          // what the empty state used to be — the grid above is already useful,
          // and the form belongs in the widget's own settings where there is
          // room for the instructions that go with it.
          <div style={{ fontSize: 11, color: "var(--faint)", lineHeight: 1.5 }}>
            Add an iCal address in this widget&apos;s settings to see your own events here.
          </div>
        )}

        {showHolidays && tall ? (
          <div style={{ fontSize: 10, color: "var(--faint)", paddingTop: 2 }}>
            Iranian holidays, from the official list as of {HOLIDAY_SOURCE_YEAR}.
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Which days of the week read as the weekend, from where the week starts. Not a
// separate setting: somebody who starts their week on Saturday has Thursday and
// Friday off, and asking them to say so twice would be asking them to keep two
// settings in agreement for no reason.
const WEEKEND = { sun: [0, 6], mon: [0, 6], sat: [4, 5] };
const WEEK_START = { sun: 0, mon: 1, sat: 6 };

function Calendar({ id, config, setConfig, refreshKey, size, options, toast }) {
  const calendars = resolveCalendars(config);
  const calendarsKey = calendars.map((c) => c.url).join("|");
  const hour24 = !!options?.hour24;
  const view = options?.view || "month";
  const alternate = options?.alternate || "none";
  const weekStartKey = options?.weekStart || "sun";
  const showHolidays = !!options?.showHolidays;
  // The month being looked at, as an offset from this one, and the day picked
  // out of it. Offset rather than an absolute month so "today" needs no
  // recalculation when the page is left open across midnight.
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState(() => formatDate(new Date()));
  const [cached, setCached] = useWidgetLocal(id, "events", null);
  const [status, setStatus] = useState(calendars.length ? "loading" : "empty");
  const [live, setLive] = useState(null);
  const [failedCount, setFailedCount] = useState(0);
  // Which origins came back refused rather than merely unreachable. Kept apart
  // because the remedies are different: one is a button the user can press, the
  // other is waiting for someone else's server.
  const [needsPermission, setNeedsPermission] = useState([]);
  // Bumped to re-run the fetch after a grant, without touching refreshKey,
  // which belongs to the widget's own refresh rate.
  const [retry, setRetry] = useState(0);
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
    const entry = { id: uid(), url, provider: providerFor(url) };
    // No permissions API in this context (e.g. local dev) — nothing to
    // request, so save anyway and let the fetch below surface its own
    // error if the address turns out to be unreachable.
    if (!hasPermissionsApi()) {
      setConfig({ calendars: [...calendars, entry] });
      return true;
    }
    // Must run before any other await, in the same click, or Chrome drops
    // the permission prompt for lacking a user gesture.
    const granted = await requestOrigin(origin);
    if (!granted) {
      toast?.("Permission needed to fetch that calendar");
      return false;
    }
    setConfig({ calendars: [...calendars, entry] });
    return true;
  };

  useEffect(() => {
    if (!calendars.length) {
      setStatus("empty");
      return undefined;
    }
    let active = true;
    setStatus((s) => (s === "ok" ? "ok" : "loading"));

    const run = async () => {
      // One calendar failing (missing permission, blocked, unreachable)
      // must not blank the others — every calendar settles independently
      // and whatever arrived gets shown.
      const results = await Promise.all(
        calendars.map(async (cal) => {
          // No permissions API means nothing to check against (e.g. local
          // dev) — same as the add flow, attempt the fetch directly rather
          // than reporting every calendar as unreachable.
          const origin = originOf(cal.url);
          const granted = !hasPermissionsApi() || (await hasOrigin(origin));
          if (!granted) return { ok: false, origin };
          try {
            const res = await fetch(cal.url);
            // fetch() only rejects on a network-level failure — a 503 or
            // 404 still resolves, and parsing whatever error page came back
            // as ICS would silently read as "zero events" rather than the
            // failure it actually is.
            if (!res.ok) return { ok: false };
            const events = parseIcs(await res.text());
            return { ok: true, events };
          } catch {
            return { ok: false };
          }
        })
      );
      if (!active) return;

      const ok = results.filter((r) => r.ok);
      setNeedsPermission([...new Set(results.filter((r) => r.origin).map((r) => r.origin))]);
      if (!ok.length) {
        setStatus("blocked");
        return;
      }
      const events = ok.flatMap((r) => r.events).sort((a, b) => a.start - b.start);
      setLive(events);
      setCached(events);
      setFailedCount(results.length - ok.length);
      setStatus("ok");
    };
    run();

    return () => {
      active = false;
    };
    // setCached is stable per key; including it would refetch on every write.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarsKey, refreshKey, retry]);

  const events = reviveDates(live || cached);

  // The month grid is worth showing with nothing connected at all, which is the
  // main thing this rebuild changes. The widget used to render a "paste your
  // iCal address" form and nothing else until one was pasted, so a calendar
  // widget with no calendar was not a calendar. In agenda view there is still
  // genuinely nothing to list, so that keeps the form.
  if (view === "month") {
    return (
      <MonthPane
        events={events}
        monthOffset={monthOffset}
        onMove={(delta) => setMonthOffset((n) => (delta === 0 ? 0 : n + delta))}
        selected={selected}
        onSelect={setSelected}
        alternate={alternate}
        weekStart={WEEK_START[weekStartKey] ?? 0}
        weekendDays={WEEKEND[weekStartKey] || WEEKEND.sun}
        showHolidays={showHolidays}
        hour24={hour24}
        hasCalendars={calendars.length > 0}
        size={size}
      />
    );
  }

  if (status === "empty") {
    return <EmptyState onSave={saveUrl} />;
  }

  if (!events) {
    // A calendar refused for want of permission is not the same as one that is
    // down, and it used to render the same sentence: a dead end that told the
    // user nothing could be done, when in fact one click fixes it. Nothing ever
    // asked again after the first refusal.
    const blockedOnPermission = status === "blocked" && needsPermission.length > 0;
    const message = blockedOnPermission
      ? needsPermission.length > 1
        ? "Daybreak needs your permission to reach these calendars."
        : "Daybreak needs your permission to reach this calendar."
      : status === "blocked"
      ? "None of your calendars are reachable right now."
      : "Loading…";

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          fontSize: 12,
          color: "var(--faint)",
          textAlign: "center",
          padding: "0 10px",
        }}
      >
        <div>{message}</div>
        {blockedOnPermission ? (
          <button
            type="button"
            onClick={async () => {
              // First await in the handler, and one call for every missing
              // origin at once: Chrome wants a user gesture, and awaiting
              // anything before this — or prompting twice — spends it.
              const granted = await requestOrigins(needsPermission);
              if (!granted) {
                toast?.("Permission is needed to read your calendar");
                return;
              }
              setStatus("loading");
              setRetry((n) => n + 1);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid var(--accentLine)",
              background: "var(--accentSoft)",
              color: "var(--accentText)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Grant access
          </button>
        ) : null}
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
        overflowY: "auto",
        overflowX: "hidden",
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
            <EventRow event={event} now={now} hour24={hour24} />
          </div>
        );
      })}
      {status === "ok" && failedCount > 0 ? (
        <div style={{ fontSize: 11, color: "var(--faint)" }}>
          {failedCount === 1
            ? "One calendar couldn't be reached — showing the rest."
            : `${failedCount} calendars couldn't be reached — showing the rest.`}
        </div>
      ) : null}
    </div>
  );
}

export default Calendar;
