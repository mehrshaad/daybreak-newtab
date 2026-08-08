// Hacker News' own Firebase-backed API — keyless, CORS-open, no rate limit
// worth worrying about at this volume (ten items every refresh at most).
export const HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json";
export const hnItemUrl = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
export const hnDiscussionUrl = (id) => `https://news.ycombinator.com/item?id=${id}`;

// An "Ask HN" or "Show HN" post carries no url of its own — the discussion
// page is the destination instead of a dead end.
export function parseHnItem(item) {
  if (!item?.id || !item.title) return null;
  return {
    id: item.id,
    title: item.title,
    url: item.url || hnDiscussionUrl(item.id),
    points: item.score ?? 0,
    comments: item.descendants ?? 0,
  };
}
