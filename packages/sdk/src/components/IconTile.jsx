import googleMark from "../assets/brand/google-favicon-2025.webp";
import { brandForLink, hashHue, inkSafeGradient } from "../brands";
import { DARK_INK, tileColor } from "../tilePalette";
import { useSiteIcon } from "../useSiteIcon";

// Google's current favicon, supplied as artwork rather than a monochrome path,
// so it is used directly instead of being tinted like the glyph brands.
const ARTWORK = { google: googleMark };

// A rounded app-icon tile with a brand glyph, falling back to a monogram on a
// hashed-hue gradient so any name renders something recognizable. Pass `url`
// wherever the thing has an address — it identifies the site far more reliably
// than whatever the user chose to call it.
// `color` and `ink` are a chosen colour, which replaces the tile's background
// and nothing else. The brand's mark still gets drawn on it: somebody who
// wanted GitHub in orange wanted GitHub in orange, not a letter G.
//
// What it does replace is the two treatments that have no background to swap —
// full-colour artwork and a fetched site icon are pictures, not a glyph on a
// gradient, so a chosen colour falls back to the brand mark or the monogram.
// It also makes the ink choice mean something, which it could not under a
// favicon.
function IconTile({ name = "", url = "", size = 40, radius, bare = false, color, ink }) {
  const key = String(name).toLowerCase().trim();
  const chosen = tileColor(color);
  const brand = brandForLink(url, name);
  const hue = hashHue(key || "?");
  const Glyph = brand?.Glyph;
  const letter = String(name).trim()[0]?.toUpperCase() || "?";

  // Full-colour artwork wins over a tinted glyph where we have it.
  const artwork = chosen ? null : ARTWORK[key];
  // Only asked for where nothing better is already known, and only worth
  // drawing once confirmed to be the site's own icon rather than Chrome's
  // stand-in globe — see siteIcon.js. Hooks cannot sit below the early
  // returns, so the conditions are in the argument instead.
  const siteIcon = useSiteIcon(!chosen && !brand && !artwork && !bare ? url : null);
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
    const bareColor = chosen ? chosen.to : brand ? brand.to : `hsl(${hue} 70% 52%)`;
    return Glyph ? (
      <Glyph size={size} color={bareColor} aria-hidden="true" />
    ) : (
      <span
        aria-hidden="true"
        style={{ fontSize: size, color: bareColor, fontWeight: 600, lineHeight: 1 }}
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
          // A gradient, not the flat panel colour, and at the same 160deg the
          // brand tiles use. A favicon tile sits in a row of brand tiles, and a
          // flat white or flat black square among sixteen gradients reads as the
          // one that failed to load. Built from the theme's own panel tokens, so
          // it is a white gradient on light and a black one on dark without
          // either being written down twice.
          background: "linear-gradient(160deg, var(--panel2), var(--panel))",
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
  // Dark ink wants the colour it was chosen against, so the darkening that
  // exists to keep a white mark legible is skipped for it — darkening a pale
  // tile under a dark glyph makes both harder to read, not easier.
  const darkInk = ink === "dark";
  const pair = chosen || brand;
  const safe = pair && !darkInk ? inkSafeGradient(pair.from, pair.to) : pair;
  const gradient = safe
    ? `linear-gradient(160deg, ${safe.from}, ${safe.to})`
    : `linear-gradient(160deg, hsl(${hue} 72% 64%), hsl(${(hue + 28) % 360} 68% 48%))`;
  const glyphColor = darkInk ? DARK_INK : "#fff";

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
        <Glyph size={Math.round(size * 0.5)} color={glyphColor} />
      ) : (
        <span
          style={{
            fontSize: size * 0.42,
            color: glyphColor,
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
