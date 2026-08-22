import googleMark from "../assets/brand/google-favicon-2025.webp";
import { brandForLink, hashHue, inkSafeGradient } from "../brands";
import { useSiteIcon } from "../useSiteIcon";

// Google's current favicon, supplied as artwork rather than a monochrome path,
// so it is used directly instead of being tinted like the glyph brands.
const ARTWORK = { google: googleMark };

// A rounded app-icon tile with a brand glyph, falling back to a monogram on a
// hashed-hue gradient so any name renders something recognizable. Pass `url`
// wherever the thing has an address — it identifies the site far more reliably
// than whatever the user chose to call it.
function IconTile({ name = "", url = "", size = 40, radius, bare = false }) {
  const key = String(name).toLowerCase().trim();
  const brand = brandForLink(url, name);
  const hue = hashHue(key || "?");
  const Glyph = brand?.Glyph;
  const letter = String(name).trim()[0]?.toUpperCase() || "?";

  // Full-colour artwork wins over a tinted glyph where we have it.
  const artwork = ARTWORK[key];
  // Only asked for where nothing better is already known, and only worth
  // drawing once confirmed to be the site's own icon rather than Chrome's
  // stand-in globe — see siteIcon.js. Hooks cannot sit below the early
  // returns, so the conditions are in the argument instead.
  const siteIcon = useSiteIcon(!brand && !artwork && !bare ? url : null);
  if (artwork) {
    return (
      <img
        src={artwork}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: bare ? 0 : (radius ?? size * 0.28),
          objectFit: "contain",
          flex: "none",
          display: "block",
        }}
      />
    );
  }

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

  // A verified site icon: its own artwork, so it sits inset on a neutral tile
  // rather than being stretched to the full square — favicons are drawn to
  // their own margins and a full-bleed one reads as too heavy next to the
  // glyph tiles it shares a row with.
  if (siteIcon) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          borderRadius: radius ?? size * 0.28,
          background: "var(--panel2)",
          display: "grid",
          placeItems: "center",
          flex: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,.18)",
        }}
      >
        <img
          src={siteIcon}
          alt=""
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          style={{
            width: Math.round(size * 0.62),
            height: Math.round(size * 0.62),
            objectFit: "contain",
            display: "block",
            // The monogram was already on screen while this was being
            // checked, so it arrives rather than snapping in.
            animation: "db-menu .18s ease both",
          }}
        />
      </div>
    );
  }

  // Darkened first where the brand's own pair is too light for a white glyph,
  // so every tile in a grid carries the same colour of mark. See
  // inkSafeGradient: the alternative was three black glyphs in a row of white
  // ones, which read as three different kinds of thing.
  const safe = brand ? inkSafeGradient(brand.from, brand.to) : null;
  const gradient = safe
    ? `linear-gradient(160deg, ${safe.from}, ${safe.to})`
    : `linear-gradient(160deg, hsl(${hue} 72% 64%), hsl(${(hue + 28) % 360} 68% 48%))`;
  const ink = "#fff";

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
        <Glyph size={Math.round(size * 0.5)} color={ink} />
      ) : (
        <span
          style={{
            fontSize: size * 0.42,
            color: ink,
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
