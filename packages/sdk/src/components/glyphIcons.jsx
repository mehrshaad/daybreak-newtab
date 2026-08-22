// Glyphs that Lucide does not carry, drawn here.
//
// Filled rather than stroked, unlike the Lu* set: a stroked figure at 24px
// loses the pose. Three stroke-based attempts at this one read as a stick
// figure, a walking cane and a snail respectively before the silhouette landed.
// Same call signature as a react-icons component, so GLYPHS can hold either.

// A person in prostration, on a mat, facing right. The pose is the most legible
// of the postures at this size: a head clear of the body, an arched back rising
// to the hips, and a ground line. Standing figures with joined hands read as a
// generic person, and praying hands alone stop reading as a person at all.
export function PrayingPerson({ size = 24, color }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color || "currentColor"}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      {/* Drawn facing left and flipped, rather than the path being mirrored by
          hand: scale(-1,1) about x=24 keeps the numbers readable if the pose
          ever needs adjusting. The -1.5 lifts it off the bottom edge. */}
      <g transform="translate(24, -1.5) scale(-1, 1)">
        <circle cx="6.1" cy="14.6" r="2.6" />
        <path d="M9.4 13.4c1.7-2.4 4-3.8 6.6-3.8 2.7 0 4.5 1.8 4.5 4.5v2.4h-2.9v-2.4c0-1.1-.7-1.8-1.7-1.8-1.7 0-3.4 1.2-4.7 3.1z" />
        <rect x="7.4" y="17" width="13" height="2.5" rx="1.25" />
        <rect x="2.4" y="20.6" width="19.2" height="1.8" rx=".9" />
      </g>
    </svg>
  );
}
