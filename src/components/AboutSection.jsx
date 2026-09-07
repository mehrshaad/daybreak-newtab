import { useEffect, useRef, useState } from "react";
import { LuBug, LuGlobe, LuMail, LuSend } from "react-icons/lu";
import { MONO, pill, useHover } from "@daybreak/sdk";
import {
  AUTHOR,
  FEEDBACK_EMAIL,
  MESSAGE_MAX,
  bugUrl,
  feedbackMailto,
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 10 }}>
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
            {left < 120 ? `${left} characters left` : `Opens your mail app to ${FEEDBACK_EMAIL}`}
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

function AboutSection({ toast }) {
  const [feedback, setFeedback] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        Made by {AUTHOR}. Bugs are best in the tracker, where they can be
        followed; anything else, mail is fine.
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
