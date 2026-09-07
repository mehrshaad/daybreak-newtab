import { appVersion } from "./version";
import { browserLabel, ISSUES_URL } from "./report";

// Who made this, and how to reach them.
//
// There was no answer to either from inside the extension. A new tab page is
// the most-seen page a person has, and the only thing it said about where it
// came from was a version number in the settings. Somebody with a bug had the
// store's review box, which is a bad place to report a bug from and a worse
// place to get an answer.
//
// Two routes, because they want different things. A bug wants a tracker: it can
// be reproduced, linked, closed, and the next person who hits it finds it.
// Everything else wants a mailbox, and asking someone to open a GitHub account
// to say "the clock could be bigger" loses the message.

export const AUTHOR = "Ali";
export const WEBSITE = "https://ali-dadashzadeh.ir/";
export const FEEDBACK_EMAIL = "ali.m.dadashzadeh@gmail.com";
export { ISSUES_URL };

// mailto: has no standard length limit and clients disagree — some Windows
// handlers cut off around 2000 characters, and a message that arrives with its
// last paragraph missing is worse than one that was never sent. So the box has
// a real limit, shown in the UI rather than enforced silently.
export const MESSAGE_MAX = 1200;

export function feedbackSubject() {
  const version = appVersion();
  return version ? `Daybreak feedback (v${version})` : "Daybreak feedback";
}

// The version and the browser build go in, because "the timer is broken" is
// unanswerable without them and nobody thinks to say. Nothing else does: not
// the board, not the settings, not what is in any widget. Same rule as a crash
// report, for the same reason — an email is somewhere this leaves the machine.
export function feedbackBody(message, { version = appVersion(), browser = browserLabel() } = {}) {
  const lines = [String(message || "").slice(0, MESSAGE_MAX).trim()];
  const facts = [version ? `Version: ${version}` : "", browser ? `Browser: ${browser}` : ""].filter(
    Boolean
  );
  if (facts.length) lines.push("", "---", ...facts);
  return lines.join("\n");
}

export function feedbackMailto(message, facts) {
  const subject = encodeURIComponent(feedbackSubject());
  const body = encodeURIComponent(feedbackBody(message, facts));
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}

// A bug report, prefilled the same way the crash screen does it, minus the
// stack there is no way to have here.
export function bugUrl({ version = appVersion(), browser = browserLabel() } = {}) {
  const body = [
    "**What happened**",
    "",
    "",
    "**What I expected**",
    "",
    "",
    "**How to make it happen again**",
    "",
    "1. ",
    "",
    "---",
    "",
    ...[version ? `- Version: ${version}` : "", browser ? `- Browser: ${browser}` : ""].filter(
      Boolean
    ),
  ].join("\n");
  return `${ISSUES_URL}/new?body=${encodeURIComponent(body)}`;
}
