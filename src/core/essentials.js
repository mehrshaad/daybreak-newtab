// Clock and weather are the two widgets glanced at first, so wherever a
// layout is chosen for the user — a preset, an auto-arrange repack — they
// lead the board instead of landing wherever the underlying list or packing
// algorithm happened to put them.
//
// Matches by instance id, not widget type: a duplicated clock ("clock#2") is
// left as an ordinary tile, since a preset only ever offers the one of each.
const ESSENTIALS = ["clock", "weather"];

// A stable partition, not a sort: anything in ESSENTIALS moves to the front in
// ESSENTIALS' own order, and every other id keeps its existing relative order.
export function essentialsFirst(ids) {
  const lead = ESSENTIALS.filter((id) => ids.includes(id));
  const rest = ids.filter((id) => !ESSENTIALS.includes(id));
  return [...lead, ...rest];
}
