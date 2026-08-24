// Builds the five boards the store screenshots are captured from.
//
//   node scripts/screenshot-boards.mjs
//
// Outputs importable backups to store-assets/boards/. Each one is a complete
// board: layout, sizes, theme, accent, background, per-widget colours, and the
// widget content — so a capture is import, wait for the data to land, shoot.
//
// Why files rather than instructions. The old five screenshots were arranged by
// hand and it shows: the same widgets in the same colours in all five, and the
// board drifts between them because nobody could reproduce the last one. A
// board that can be imported is a board that can be re-shot in a year when the
// UI has moved on, and it makes the five deliberately different from each other
// rather than accidentally similar.
//
// Built by patching a known-good export rather than assembled from nothing:
// settings has a schema, a migration path and defaults this script has no
// business reimplementing, and a backup that restores wrong is worse than no
// backup. daybreak-demo-board.json is a real export and supplies the shape.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = join(root, "store-assets", "boards");

// Cities, in the shape the widgets store them.
const CITY = {
  lisbon: {
    name: "Lisbon",
    latitude: 38.71667,
    longitude: -9.13333,
    timezone: "Europe/Lisbon",
    country: "Portugal",
    country_code: "PT",
    admin1: "Lisboa",
  },
  kyoto: {
    name: "Kyoto",
    latitude: 35.02107,
    longitude: 135.75385,
    timezone: "Asia/Tokyo",
    country: "Japan",
    country_code: "JP",
    admin1: "Kyoto",
  },
  vancouver: {
    name: "Vancouver",
    latitude: 49.24966,
    longitude: -123.11934,
    timezone: "America/Vancouver",
    country: "Canada",
    country_code: "CA",
    admin1: "British Columbia",
  },
  istanbul: {
    name: "Istanbul",
    latitude: 41.01384,
    longitude: 28.94966,
    timezone: "Europe/Istanbul",
    country: "Turkey",
    country_code: "TR",
    admin1: "Istanbul",
  },
};

// Content. Warm and plausible rather than corporate: a store visitor is
// deciding whether they want this on their own screen, and "Ship Q3 roadmap
// deck" is a photograph of somebody else's job.
const TASKS = [
  { id: "t1", text: "Book the Lisbon flights", done: false, due: "" },
  { id: "t2", text: "Ring Dad about the weekend", done: false, due: "" },
  { id: "t3", text: "Finish chapter four", done: false, due: "" },
  { id: "t4", text: "Water the tomatoes", done: true, due: "" },
  { id: "t5", text: "Renew the library card", done: true, due: "" },
];

const HABITS = [
  { id: "h1", name: "Read 20 pages", target: 5, targetWeeks: 0 },
  { id: "h2", name: "Walk outside", target: 6, targetWeeks: 0 },
  { id: "h3", name: "Practise piano", target: 4, targetWeeks: 0 },
];

// A pattern with gaps in it, because a wall of ticks reads as a mock-up.
function habitHistory(today = new Date()) {
  const day = (back) => {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    return d.toISOString().slice(0, 10);
  };
  const fill = (backs) => Object.fromEntries(backs.map((b) => [day(b), true]));
  return {
    h1: fill([0, 1, 2, 4, 5, 7, 8]),
    h2: fill([0, 1, 3, 4, 5, 6]),
    h3: fill([1, 2, 5]),
  };
}

// Brands the marks are drawn for, so the icon grid shows what it can do.
const LINKS = [
  { id: "l1", name: "GitHub", url: "https://github.com" },
  { id: "l2", name: "Figma", url: "https://figma.com" },
  { id: "l3", name: "Notion", url: "https://notion.so" },
  { id: "l4", name: "YouTube", url: "https://youtube.com" },
  { id: "l5", name: "Spotify", url: "https://spotify.com" },
  { id: "l6", name: "Duolingo", url: "https://duolingo.com" },
];

const ZONES = [
  { city: "Lisbon", tz: "Europe/Lisbon" },
  { city: "New York", tz: "America/New_York" },
  { city: "Kyoto", tz: "Asia/Tokyo" },
  { city: "Sydney", tz: "Australia/Sydney" },
];

// Dated forward so they are still ahead whenever the shot is taken.
function countdowns(today = new Date()) {
  const ahead = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  return [
    { id: "c1", title: "Lisbon", date: ahead(23), yearly: false, emoji: "" },
    { id: "c2", title: "Mum's birthday", date: ahead(61), yearly: true, emoji: "" },
    { id: "c3", title: "Marathon", date: ahead(118), yearly: false, emoji: "" },
  ];
}

// Rows that add to twelve, so no board has a ragged edge in a screenshot. The
// board centres a short last row, but a screenshot is a still: it cannot show
// that a gap is deliberate.
const SHOTS = [
  {
    file: "shot-1-hero.json",
    what: "The hero. A full, arranged board on a warm light theme.",
    appearance: { theme: "light", accent: "#ffb26f", wall: "Aurora", alpha: 55, blur: true },
    name: "Sam",
    rows: [
      ["clock", 3, 2],
      ["weather", 4, 2],
      ["links", 5, 2],
      ["tasks", 4, 3],
      ["habits", 4, 3],
      ["scratchpad", 4, 3],
      ["worldclocks", 3, 2],
      ["timer", 3, 2],
      ["quote", 3, 2],
      ["moon", 3, 2],
    ],
    city: CITY.lisbon,
    options: { clock: { analog: true, face: "squared", dateForm: "full" } },
  },
  {
    file: "shot-2-store.json",
    what: "The board the Store is opened over. Dark, cool, so the sheet reads.",
    appearance: { theme: "dark", accent: "#9b96ff", wall: "Nebula", alpha: 55, blur: true },
    name: "Sam",
    rows: [
      ["clock", 3, 2],
      ["weather", 4, 2],
      ["links", 5, 2],
      ["news", 4, 3],
      ["calendar", 4, 3],
      ["habits", 4, 3],
      ["gapps", 4, 2],
      ["worldclocks", 4, 2],
      ["quote", 4, 2],
    ],
    city: CITY.kyoto,
    options: { clock: { analog: false, textSize: "l" } },
  },
  {
    file: "shot-3-colours.json",
    what: "A colour on every tile. The feature this release leads with.",
    appearance: { theme: "light", accent: "#7de2b8", wall: "Prism", alpha: 60, blur: true },
    name: "Sam",
    rows: [
      ["clock", 3, 2],
      ["tasks", 4, 2],
      ["weather", 3, 2],
      ["countdown", 2, 2],
      ["habits", 4, 2],
      ["worldclocks", 4, 2],
      ["moon", 2, 2],
      ["currency", 2, 2],
      ["links", 4, 2],
      ["crypto", 2, 2],
      ["timer", 2, 2],
      ["quote", 4, 2],
    ],
    city: CITY.vancouver,
    // One per tile, spread around the wheel and including the two deep tints,
    // which is the point of them existing.
    tints: {
      clock: "#6f9bff",
      tasks: "#86d99a",
      weather: "#f5d979",
      countdown: "#ff8fb1",
      habits: "#c79bff",
      worldclocks: "#6fd6e5",
      moon: "#9b96ff",
      currency: "#3f8f8f",
      links: "#ffb26f",
      quote: "#a34a7f",
      crypto: "#b6dd7f",
      timer: "#ff8f8f",
    },
    options: { clock: { analog: true, face: "round" } },
  },
  {
    file: "shot-4-profiles.json",
    what: "The work board. Add a second profile by hand before shooting; see SUBMISSION.md.",
    appearance: { theme: "light", accent: "#6f9bff", wall: "Halo", alpha: 55, blur: true },
    name: "Sam",
    rows: [
      ["clock", 3, 2],
      ["timer", 3, 2],
      ["worldclocks", 3, 2],
      ["moon", 3, 2],
      ["calendar", 4, 3],
      ["tasks", 5, 3],
      ["news", 3, 3],
      ["links", 5, 2],
      ["habits", 4, 2],
      ["quote", 3, 2],
    ],
    city: CITY.lisbon,
    options: { clock: { analog: false, textSize: "l" } },
  },
  {
    file: "shot-5-themes.json",
    what: "Captured twice, dark then light, for the split card. Same board both times.",
    appearance: { theme: "dark", accent: "#ef92dc", wall: "Mesh", alpha: 55, blur: true },
    name: "Sam",
    rows: [
      ["clock", 3, 2],
      ["weather", 4, 2],
      ["prayer", 3, 2],
      ["moon", 2, 2],
      ["sun", 4, 2],
      ["air", 4, 2],
      ["links", 4, 2],
      ["onthisday", 4, 3],
      ["habits", 4, 3],
      ["worldclocks", 4, 3],
    ],
    city: CITY.istanbul,
    options: { clock: { analog: true, face: "squared" } },
  },
];

function widgetRecords(shot, ids) {
  const out = {};
  for (const id of ids) {
    const rec = { options: shot.options?.[id] || {}, rate: "Live", config: {} };
    if (shot.tints?.[id]) rec.tint = shot.tints[id];
    if (id === "weather" || id === "air" || id === "sun" || id === "prayer") {
      rec.config = { city: shot.city };
    }
    if (id === "worldclocks") rec.config = { zones: ZONES };
    if (id === "tasks") rec.config = { items: TASKS };
    if (id === "habits") rec.config = { habits: HABITS };
    if (id === "links") rec.config = { items: LINKS };
    if (id === "countdown") rec.config = { entries: countdowns() };
    if (id === "currency") rec.config = { base: "EUR", targets: ["USD", "GBP", "JPY"] };
    if (id === "crypto") rec.config = { fiat: "usd", coins: ["bitcoin", "ethereum", "solana"] };
    out[id] = rec;
  }
  return out;
}

const template = JSON.parse(
  await readFile(join(root, "daybreak-demo-board.json"), "utf8")
);

await mkdir(outDir, { recursive: true });

for (const shot of SHOTS) {
  const ids = shot.rows.map(([id]) => id);
  const sizes = Object.fromEntries(shot.rows.map(([id, w, h]) => [id, [w, h]]));

  const settings = {
    ...template.settings,
    board: { ids, sizes, layoutName: "Yours", installed: ids, saved: null },
    appearance: { ...template.settings.appearance, ...shot.appearance, tileLabels: "both" },
    behavior: {
      ...template.settings.behavior,
      // Or the welcome card sits over the middle of every screenshot.
      tourDone: true,
      showGreeting: true,
    },
    profile: { name: shot.name },
    widgets: widgetRecords(shot, ids),
  };

  const backup = {
    kind: "daybreak-backup",
    version: template.version,
    exportedAt: new Date(0).toISOString(),
    settings,
    buckets: {
      "habits:history": habitHistory(),
      "scratchpad:text":
        "Lisbon\n- Tuesday, early flight\n- the blue tile place by the station\n- pastries, obviously",
    },
  };

  // Rows have to add to twelve or the board leaves a gap a still cannot explain.
  let row = 0;
  for (const [, w] of shot.rows) row = (row + w) % 12;
  if (row !== 0) {
    throw new Error(`${shot.file}: widths do not divide into rows of 12 (left ${row} over)`);
  }

  await writeFile(join(outDir, shot.file), `${JSON.stringify(backup, null, 2)}\n`);
  console.log(`${shot.file.padEnd(24)} ${ids.length} widgets  ${shot.what}`);
}

console.log(`\n${SHOTS.length} boards written to store-assets/boards/`);
