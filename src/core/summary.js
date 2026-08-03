import { typeOf } from "../widgets/registry";

// The hero's subtitle. The design shipped invented copy ("2 meetings, 4 open
// tasks, and clear skies until Thursday"); this reports only what is actually
// on the board, and says nothing when there is nothing to say.
export function heroSummary(settings, ids) {
  const parts = [];

  let open = 0;
  let hasTasks = false;
  for (const id of ids || []) {
    if (typeOf(id) !== "tasks") continue;
    hasTasks = true;
    const items = settings.widgets?.[id]?.config?.items;
    if (Array.isArray(items)) open += items.filter((t) => !t.done).length;
  }
  if (hasTasks) {
    parts.push(
      open === 0 ? "no tasks left" : `${open} open task${open === 1 ? "" : "s"}`
    );
  }

  const zones = (ids || []).filter((id) => typeOf(id) === "worldclocks").length;
  if (zones) {
    const total = (ids || []).reduce((n, id) => {
      if (typeOf(id) !== "worldclocks") return n;
      const list = settings.widgets?.[id]?.config?.zones;
      return n + (Array.isArray(list) ? list.length : 2);
    }, 0);
    parts.push(`${total} clock${total === 1 ? "" : "s"}`);
  }

  if (!parts.length) return "";
  const sentence = parts.join(" · ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
