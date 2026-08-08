// Wikipedia's REST feed — keyless, CORS-open from en.wikipedia.org directly.
// The newer api.wikimedia.org host wants a User-Agent a browser cannot set,
// so this deliberately targets the older REST path instead.
export function todayKey(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

export function onThisDayUrl(date = new Date()) {
  const [mm, dd] = todayKey(date).split("-");
  return `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`;
}

// Each event's first page (if any) carries the link worth showing; the rest
// are related articles the widget has no room for.
export function parseEvents(data, limit = 10) {
  if (!Array.isArray(data?.events)) return [];
  return data.events.slice(0, limit).map((e) => {
    const page = e.pages?.[0];
    return {
      year: e.year,
      text: e.text,
      url: page?.content_urls?.desktop?.page || null,
    };
  });
}
