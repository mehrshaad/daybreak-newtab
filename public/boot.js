// Runs parser-blocking in <head>, before the first paint, so neither the page
// colour nor the tab icon flashes while React and chrome.storage catch up.
// This must be an external file: an inline script would breach the extension
// CSP (script-src 'self').
//
// The page colour comes from the theme the user last saw, mirrored to
// localStorage by App.jsx — chrome.storage is async and can't be read before
// first paint. First-ever run has no mirror yet and falls back to the OS
// scheme, which is also what the default "system" theme resolves to.
//
// The tab icon deliberately follows the OS scheme, not the app theme — same
// policy as src/core/favicon.js, which takes over from here and keeps it
// updated if the OS theme changes mid-session.
(function () {
  var stored = null;
  try {
    stored = localStorage.getItem("daybreakTheme");
  } catch {
    /* storage disabled */
  }
  var prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var dark = stored ? stored !== "light" : prefersDark;

  var html = document.documentElement;
  // Marks the page as the app rather than the GitHub Pages landing, which
  // serves this same index.html but never loads this file. index.html hides
  // #db-landing on the strength of this class, from a <style> already in
  // <head> — so the block is gone before it has even been parsed. The app's
  // stylesheet hides it too, but only once that stylesheet exists: in the
  // packaged build it is render-blocking and beats the first paint, while in
  // dev it arrives with the JS, a good half second after the landing has
  // already painted.
  html.classList.add("db-app");
  // Must match baseColor() in src/core/tokens.js.
  html.style.backgroundColor = dark ? "#0a0b0e" : "#f3f3f1";
  html.style.colorScheme = dark ? "dark" : "light";

  var link = document.querySelector('link[rel="icon"]');
  if (link) {
    link.href = prefersDark ? "./favicon-dark.png" : "./favicon-light.png";
  }
})();
