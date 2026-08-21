import {
  LuBanknote,
  LuBitcoin,
  LuBookmark,
  LuCalendarCheck,
  LuCalendarDays,
  LuCalendarRange,
  LuClock,
  LuLayoutGrid,
  LuHistory,
  LuLink,
  LuMoon,
  LuNewspaper,
  LuNotebookPen,
  LuQuote,
  LuSquareCheck,
  LuSun,
  LuSunrise,
  LuTimer,
  LuWind,
} from "react-icons/lu";

// Glyph names a manifest can ask for. Deliberately generic (`clock`, `weather`,
// `list`) so a widget from another repository can pick one without shipping
// artwork or knowing which icon set is in use. WidgetMark falls back to the
// widget's initial for anything not listed here, so a missing or misspelled name
// can never render an empty chip.
export const GLYPHS = {
  air: LuWind,
  moon: LuMoon,
  sun: LuSunrise,
  bookmark: LuBookmark,
  calendar: LuCalendarCheck,
  calendarDays: LuCalendarDays,
  calendarRange: LuCalendarRange,
  clock: LuClock,
  crypto: LuBitcoin,
  currency: LuBanknote,
  grid: LuLayoutGrid,
  history: LuHistory,
  link: LuLink,
  list: LuSquareCheck,
  news: LuNewspaper,
  note: LuNotebookPen,
  quote: LuQuote,
  timer: LuTimer,
  weather: LuSun,
};

export const glyphNames = () => Object.keys(GLYPHS);
