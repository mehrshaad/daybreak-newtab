// Where an hour marker sits when the tile itself is the dial.
//
// A round or squircle dial is drawn inside the tile and is the same shape
// whatever the tile is. Once the tile's chrome is gone and the clock becomes
// the widget, the dial is the tile, and a tile is a rounded rectangle of
// whatever proportions the board gave it. So the markers have to be projected
// onto that rectangle rather than onto a circle inscribed in it — otherwise a
// wide tile shows a small round clock floating in the middle of it, which is
// the thing this is meant to stop.
//
// The projection is the standard ray-to-rectangle one: from the centre, the
// first edge the ray crosses is whichever of the two it reaches first.
export function edgePoint(degrees, halfWidth, halfHeight) {
  // Degrees clockwise from twelve o'clock, which is how a clock face counts and
  // not how atan2 does.
  const radians = ((degrees - 90) * Math.PI) / 180;
  const dx = Math.cos(radians);
  const dy = Math.sin(radians);
  // A ray straight up has dx of zero, so the vertical edge is infinitely far
  // away rather than a division to guard after the fact.
  const toVertical = dx === 0 ? Infinity : Math.abs(halfWidth / dx);
  const toHorizontal = dy === 0 ? Infinity : Math.abs(halfHeight / dy);
  const t = Math.min(toVertical, toHorizontal);
  return { x: dx * t, y: dy * t, distance: t };
}

// The two ends of a marker: on the edge, and MARK_LEN inward along the same ray.
export function edgeMarker(degrees, halfWidth, halfHeight, length) {
  const outer = edgePoint(degrees, halfWidth, halfHeight);
  // Clamped at zero: on a tile smaller than the marker length the inner end
  // would otherwise come out negative, drawing a line from the edge back out
  // through the opposite side. It collapses to the centre instead.
  const scale =
    outer.distance === 0 ? 0 : Math.max(0, (outer.distance - length) / outer.distance);
  return {
    x1: outer.x * scale,
    y1: outer.y * scale,
    x2: outer.x,
    y2: outer.y,
  };
}
