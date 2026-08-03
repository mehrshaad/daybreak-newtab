import { brandFor, hashHue } from "../core/brands";

// A rounded app-icon tile with a brand glyph, falling back to a monogram on a
// hashed-hue gradient so any name renders something recognizable.
function IconTile({ name = "", size = 40, radius, bare = false }) {
  const brand = brandFor(name);
  const hue = hashHue(String(name).toLowerCase().trim() || "?");
  const Glyph = brand?.Glyph;
  const letter = String(name).trim()[0]?.toUpperCase() || "?";

  // "bare" = just the coloured glyph, no tile (used in the search box).
  if (bare) {
    const color = brand ? brand.to : `hsl(${hue} 70% 52%)`;
    return Glyph ? (
      <Glyph size={size} color={color} aria-hidden="true" />
    ) : (
      <span
        aria-hidden="true"
        style={{ fontSize: size, color, fontWeight: 600, lineHeight: 1 }}
      >
        {letter}
      </span>
    );
  }

  const gradient = brand
    ? `linear-gradient(160deg, ${brand.from}, ${brand.to})`
    : `linear-gradient(160deg, hsl(${hue} 72% 64%), hsl(${(hue + 28) % 360} 68% 48%))`;

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? size * 0.28,
        background: gradient,
        display: "grid",
        placeItems: "center",
        flex: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,.18)",
      }}
    >
      {Glyph ? (
        <Glyph size={Math.round(size * 0.5)} color="#fff" />
      ) : (
        <span
          style={{
            fontSize: size * 0.42,
            color: "#fff",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {letter}
        </span>
      )}
    </div>
  );
}

export default IconTile;
