import { useEffect, useRef, useState } from "react";
import { LuBug, LuGlobe, LuMail, LuSend } from "react-icons/lu";
import { SiGithub, SiLinkedin } from "react-icons/si";
import { MONO, pill, useHover } from "@daybreak/sdk";
import {
  AUTHOR_EMOJI,
  AUTHOR_FULL,
  AUTHOR_PHOTO,
  FEEDBACK_EMAIL,
  MESSAGE_MAX,
  bugUrl,
  feedbackMailto,
  profileLinks,
  WEBSITE,
} from "../core/contact";
import { versionLabel } from "../core/version";
import { Collapse, Pill } from "./primitives";

// A pill that is a link. Pill is a <button>, and a button that calls
// window.open is worse than an anchor in every way that matters: no middle
// click, no copy link address, no idea where it goes before you press it.
function LinkPill({ href, icon: Icon, children }) {
  const [hovered, bind] = useHover();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...pill(false, {
          padding: "8px 11px",
          fontSize: 13,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
        }),
        ...(hovered ? { background: "var(--panel2)" } : null),
      }}
      {...bind}
    >
      <Icon size={14} aria-hidden />
      {children}
    </a>
  );
}

// The feedback box.
//
// It opens a mail client rather than posting anywhere, which is the honest
// thing for a page with no server behind it: the message is composed here, and
// the person sending it sees it in their own outbox before it goes. Nothing is
// transmitted by pressing anything in this panel.
function FeedbackPanel({ open, onSent }) {
  const [text, setText] = useState("");
  const boxRef = useRef(null);

  // Focus follows the disclosure, but only after it has finished opening, or
  // the drawer scrolls to a box that is still 8px tall.
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => boxRef.current?.focus(), 340);
    return () => clearTimeout(id);
  }, [open]);

  const trimmed = text.trim();
  const left = MESSAGE_MAX - text.length;

  return (
    <Collapse open={open}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          paddingTop: 10,
        }}
      >
        <textarea
          ref={boxRef}
          value={text}
          maxLength={MESSAGE_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="What would make this better?"
          rows={4}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: 82,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "var(--panel)",
            color: "var(--fg)",
            font: "inherit",
            fontSize: 13,
            lineHeight: 1.5,
            outline: "none",
            transition: "border-color .18s ease, background .18s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "var(--accent)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--line)";
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: left < 120 ? "var(--fg)" : "var(--dim)",
              transition: "color .2s ease, opacity .2s ease",
              opacity: trimmed ? 1 : 0.65,
            }}
          >
            {left < 120
              ? `${left} characters left`
              : `Opens your mail app to ${FEEDBACK_EMAIL}`}
          </span>
          <Pill
            onClick={() => {
              if (!trimmed) return;
              window.location.href = feedbackMailto(trimmed);
              setText("");
              onSent?.();
            }}
            disabled={!trimmed}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              opacity: trimmed ? 1 : 0.45,
              cursor: trimmed ? "pointer" : "default",
              transition: "opacity .2s ease, background .18s ease",
            }}
          >
            <LuSend size={14} aria-hidden />
            Compose
          </Pill>
        </div>
        <div style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.5 }}>
          Your message, the version and the browser build. Nothing from your
          board, your settings or your widgets.
        </div>
      </div>
    </Collapse>
  );
}

// The face of the thing, with a fallback that is not a broken image.
//
// The photo is optional and ships in the package, so there is no request and
// no third party — but there is also no guarantee the file is there. onError
// switches to the emoji rather than leaving the browser's torn-page icon in a
// settings panel, and the emoji is what shows until the image decodes, so
// there is never an empty square either.
function Portrait({ size = 44 }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);
  // A cached image has already fired `load` by the time React attaches the
  // handler, so onLoad never runs and the portrait stays at opacity 0 behind
  // the emoji. Which is every tab after the first — the one case that matters
  // most on a new tab page. `complete` is the only way to catch it.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !el.complete) return;
    if (el.naturalWidth > 0) setLoaded(true);
    else setFailed(true);
  }, []);
  const showPhoto = !failed;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        fontSize: Math.round(size * 0.5),
        lineHeight: 1,
        background: "var(--panel2)",
        border: "1px solid var(--line)",
      }}
    >
      <span
        style={{ opacity: loaded ? 0 : 1, transition: "opacity .25s ease" }}
      >
        {AUTHOR_EMOJI}
      </span>
      {showPhoto ? (
        <img
          ref={imgRef}
          src={AUTHOR_PHOTO}
          alt=""
          // Dragging it out of the panel serves nobody and looks like a bug.
          draggable={false}
          width={size}
          height={size}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            WebkitUserDrag: "none",
            userSelect: "none",
            opacity: loaded ? 1 : 0,
            transition: "opacity .25s ease",
          }}
        />
      ) : null}
    </div>
  );
}

// Name, face and the places to find them, as one block rather than a sentence
// in the small print. The extension is the most-opened page somebody has and
// it said almost nothing about where it came from.
function Byline() {
  const profiles = profileLinks();
  const ICONS = { github: SiGithub, linkedin: SiLinkedin };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Portrait />
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div style={{ fontSize: 14, color: "var(--fg)", fontWeight: 500 }}>
          {AUTHOR_FULL}
        </div>
        <div style={{ fontSize: 12, color: "var(--dim)" }}>Made Daybreak</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {profiles.map((p) => {
          const Icon = ICONS[p.key] || LuGlobe;
          return (
            <IconLink key={p.key} href={p.url} label={p.label}>
              <Icon size={15} aria-hidden />
            </IconLink>
          );
        })}
      </div>
    </div>
  );
}

// A square link for a mark with no words next to it, so a row of them reads as
// a row rather than as three pills of different widths.
function IconLink({ href, label, children }) {
  const [hovered, bind] = useHover();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={{
        display: "grid",
        placeItems: "center",
        width: 32,
        height: 32,
        borderRadius: 10,
        color: hovered ? "var(--fg)" : "var(--dim)",
        background: hovered ? "var(--panel2)" : "transparent",
        border: "1px solid var(--line)",
        textDecoration: "none",
        transition: "background .18s ease, color .18s ease",
      }}
      {...bind}
    >
      {children}
    </a>
  );
}

function AboutSection({ toast }) {
  const [feedback, setFeedback] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Byline />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 13,
        }}
      >
        <span style={{ color: "var(--dim)" }}>Version</span>
        <span style={{ fontFamily: MONO, fontSize: 12, color: "var(--fg)" }}>
          {versionLabel() || "—"}
        </span>
      </div>

      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5 }}>
        <b>Thanks for giving Daybreak a try!</b> 💚
        <br />
        Found a bug? Please report it through GitHub Issues so it can be tracked
        and fixed. Have feedback, an idea, or just want to say hi? Feel free to
        email me directly!
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <LinkPill href={WEBSITE} icon={LuGlobe}>
          Website
        </LinkPill>
        <Pill
          active={feedback}
          onClick={() => setFeedback((v) => !v)}
          style={{
            padding: "8px 11px",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <LuMail size={14} aria-hidden />
          Feedback
        </Pill>
        <LinkPill href={bugUrl()} icon={LuBug}>
          Report a bug
        </LinkPill>
      </div>

      <FeedbackPanel
        open={feedback}
        onSent={() => {
          setFeedback(false);
          toast?.("Feedback opened in your mail app");
        }}
      />
    </div>
  );
}

export default AboutSection;
