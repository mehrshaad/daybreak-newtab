import {
  LuBookmark,
  LuCalendarCheck,
  LuClock,
  LuLayoutGrid,
  LuHistory,
  LuLink,
  LuNotebookPen,
  LuQuote,
  LuSquareCheck,
  LuSun,
  LuTimer,
} from "react-icons/lu";

// Glyph names a manifest can ask for. Deliberately generic (`clock`, `weather`,
// `list`) so a widget from another repository can pick one without shipping
// artwork or knowing which icon set is in use. WidgetMark falls back to the
// widget's initial for anything not listed here, so a missing or misspelled name
// can never render an empty chip.
export const GLYPHS = {
  bookmark: LuBookmark,
  calendar: LuCalendarCheck,
  clock: LuClock,
  grid: LuLayoutGrid,
  history: LuHistory,
  link: LuLink,
  list: LuSquareCheck,
  note: LuNotebookPen,
  quote: LuQuote,
  timer: LuTimer,
  weather: LuSun,
};

export const glyphNames = () => Object.keys(GLYPHS);
