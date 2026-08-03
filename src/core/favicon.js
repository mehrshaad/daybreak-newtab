import darkIcon from "../assets/icon/daybreak-dark.png";
import lightIcon from "../assets/icon/daybreak-light.png";

// The tab icon follows the browser/OS colour scheme, deliberately *not* the
// extension's own theme setting: a dark-tile icon belongs on dark browser
// chrome regardless of how the page itself is themed.
//
// prefers-color-scheme reports the browser/OS preference and is unaffected by
// the `color-scheme` property the app sets on the root, so the two stay
// independent by construction.
//
// Swapped from script rather than with <link media="..."> because MV3 forbids
// inline script and media-attribute support on favicon links is inconsistent;
// this works everywhere and reacts when the OS theme changes mid-session.
const QUERY = "(prefers-color-scheme: dark)";

function apply(prefersDark) {
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = prefersDark ? darkIcon : lightIcon;
}

export function installFavicon() {
  const mq = window.matchMedia?.(QUERY);
  apply(!!mq?.matches);
  mq?.addEventListener("change", (e) => apply(e.matches));
}
