import { appVersion, BUILD_DATE } from "./version";

export const REPO_URL = "https://github.com/mehrshaad/daybreak-newtab";
export const ISSUES_URL = `${REPO_URL}/issues`;

// A prefilled GitHub issue for a crash.
//
// The error screen used to say "reloading usually fixes it" and nothing else:
// no error, no way to tell anybody, and the one person who could fix it never
// heard. A report is only useful if it arrives with the stack, and asking
// somebody to open devtools and copy it is asking too much.
//
// What goes in it is deliberately narrow. The message, the stack, the React
// component stack, the extension version and the browser build — all of it
// about the code, none of it about the person. The board, the settings, the
// widget config, anything typed into a widget: none of that is here and none of
// it should be. A crash report that quietly carried somebody's notes or their
// quick links into a public issue tracker would be a far worse bug than the one
// being reported.
//
// GitHub takes the title and body as query parameters. Long stacks are trimmed
// rather than truncating the URL somewhere arbitrary, because a browser that
// silently drops the tail of an over-long URL would produce an issue with half
// a sentence in it.
const URL_BUDGET = 6000;
const STACK_LINES = 12;

function trimStack(stack, lines = STACK_LINES) {
  if (!stack) return "";
  const kept = String(stack).trim().split("\n").slice(0, lines);
  const total = String(stack).trim().split("\n").length;
  if (total > lines) kept.push(`… ${total - lines} more`);
  return kept.join("\n");
}

// The browser build, from the user agent. Only the Chrome version: the full
// string carries the platform and a good deal else, and the version is what
// actually helps reproduce something.
export function browserLabel(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent) {
  const match = /Chrome\/(\d+\.\d+\.\d+\.\d+)/.exec(userAgent || "");
  return match ? `Chrome ${match[1]}` : "";
}

export function issueTitle(error, where) {
  const message = String(error?.message || error || "Unknown error").split("\n")[0];
  const prefix = where ? `${where}: ` : "";
  // Short enough to read in a list of issues without being cut off.
  return `${prefix}${message}`.slice(0, 120);
}

export function issueBody({ error, componentStack, where, version, browser } = {}) {
  const lines = [
    "<!-- Thanks for reporting. Everything below was filled in automatically;",
    "     nothing from your board, your settings or your widgets is included. -->",
    "",
    "**What happened**",
    "",
    where ? `Crashed in: ${where}` : "Crashed on the board.",
    "",
    "**What I was doing**",
    "",
    "<!-- If you remember, a line here helps a lot. -->",
    "",
    "---",
    "",
    `- Version: ${version || "unknown"}`,
    ...(BUILD_DATE ? [`- Built: ${BUILD_DATE}`] : []),
    ...(browser ? [`- Browser: ${browser}`] : []),
    "",
    "**Error**",
    "",
    "```",
    String(error?.message || error || "Unknown error"),
    "```",
  ];

  const stack = trimStack(error?.stack);
  if (stack) lines.push("", "**Stack**", "", "```", stack, "```");

  const component = trimStack(componentStack, 10);
  if (component) lines.push("", "**Component stack**", "", "```", component, "```");

  return lines.join("\n");
}

export function issueUrl({ error, componentStack, where } = {}) {
  const version = appVersion();
  const browser = browserLabel();
  const title = issueTitle(error, where);
  let body = issueBody({ error, componentStack, where, version, browser });

  // Drop the component stack first and then the stack, rather than letting the
  // URL be cut off mid-word by whatever limit the browser happens to enforce.
  if (encodeURIComponent(body).length > URL_BUDGET) {
    body = issueBody({ error, where, version, browser });
  }
  if (encodeURIComponent(body).length > URL_BUDGET) {
    body = issueBody({ error: { message: error?.message }, where, version, browser });
  }

  return `${ISSUES_URL}/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
