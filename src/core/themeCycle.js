// The header's theme button, as data.
//
// Settings offers three choices and the button used to offer two, flipping
// between light and dark off the *resolved* theme. So a board following the
// system had no idea it was: the button showed a moon at night, and pressing it
// wrote an explicit "light" that then stayed light at every hour, with no way
// back to following the system except by opening Settings and finding the row.
// A control that can leave a state it cannot return to is a dead end.
//
// A ring instead, starting from the setting rather than from what it resolved
// to. System first because it is the default and the one worth getting back
// to, and sunrise last because it is the deliberate choice — nobody arrives at
// it by pressing a button twice.
export const THEME_CYCLE = ["system", "light", "dark", "sun"];

export function nextTheme(current) {
  const at = THEME_CYCLE.indexOf(current);
  // An unknown or missing value lands on the first press at the head of the
  // ring rather than nowhere.
  return THEME_CYCLE[(at + 1) % THEME_CYCLE.length];
}

export const THEME_LABELS = {
  system: "following your system",
  light: "light",
  dark: "dark",
  sun: "following the sun",
};
