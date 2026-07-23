import {
  SiDropbox,
  SiDuckduckgo,
  SiGithub,
  SiGmail,
  SiGoogle,
  SiGooglecalendar,
  SiGoogleclassroom,
  SiGooglecolab,
  SiGoogledocs,
  SiGoogledrive,
  SiGoogleforms,
  SiGooglekeep,
  SiGooglemaps,
  SiGooglemeet,
  SiGooglenews,
  SiGooglephotos,
  SiGoogleplay,
  SiGooglescholar,
  SiGooglesheets,
  SiGoogleslides,
  SiGoogletranslate,
  SiInstagram,
  SiLinkedin,
  SiMega,
  SiNetflix,
  SiOpenai,
  SiReddit,
  SiTelegram,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import {
  LuBookOpen,
  LuGamepad2,
  LuKeyRound,
  LuPencilRuler,
  LuPresentation,
  LuSearch,
  LuUser,
} from "react-icons/lu";
import "../styles/components/IconTile.scss";

// name -> { Glyph, from, to }. Gradients are iOS-app-icon style: a lighter tint
// at the top flowing into the brand color. The glyph itself is a recognizable
// open-licensed mark; the tile + gradient is the in-house Daybreak treatment.
const BRANDS = {
  // shortcuts
  chatgpt: { Glyph: SiOpenai, from: "#1fbf9c", to: "#0d8a68" },
  openai: { Glyph: SiOpenai, from: "#1fbf9c", to: "#0d8a68" },
  youtube: { Glyph: SiYoutube, from: "#ff5a5a", to: "#e00000" },
  github: { Glyph: SiGithub, from: "#5b5b5b", to: "#1a1a1a" },
  linkedin: { Glyph: SiLinkedin, from: "#2b8fd6", to: "#0a66c2" },
  telegram: { Glyph: SiTelegram, from: "#37bbfe", to: "#1f96d4" },
  reddit: { Glyph: SiReddit, from: "#ff7a45", to: "#ff4500" },
  dropbox: { Glyph: SiDropbox, from: "#3d86ff", to: "#0061ff" },
  mega: { Glyph: SiMega, from: "#ff5b5b", to: "#d9272e" },
  instagram: { Glyph: SiInstagram, from: "#f9807d", to: "#c913b9" },
  whatsapp: { Glyph: SiWhatsapp, from: "#4ce072", to: "#25d366" },
  netflix: { Glyph: SiNetflix, from: "#ff4d57", to: "#e50914" },
  x: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },
  twitter: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },
  // search engines
  google: { Glyph: SiGoogle, from: "#5a9bff", to: "#3d6fe0" },
  duckduckgo: { Glyph: SiDuckduckgo, from: "#ff7a4d", to: "#de5833" },
  bing: { Glyph: LuSearch, from: "#37c4b8", to: "#0d8577" },
  // google apps
  gmail: { Glyph: SiGmail, from: "#ff6a5b", to: "#e0392b" },
  "google maps": { Glyph: SiGooglemaps, from: "#5aa85f", to: "#34a853" },
  "google drive": { Glyph: SiGoogledrive, from: "#ffd24d", to: "#f4b400" },
  "google translate": { Glyph: SiGoogletranslate, from: "#5a9bff", to: "#4285f4" },
  "google photos": { Glyph: SiGooglephotos, from: "#5a9bff", to: "#4285f4" },
  "google calendar": { Glyph: SiGooglecalendar, from: "#5a9bff", to: "#4285f4" },
  "google docs": { Glyph: SiGoogledocs, from: "#5a9bff", to: "#2a72e0" },
  "google play": { Glyph: SiGoogleplay, from: "#4fd6c4", to: "#00b3a6" },
  "google meet": { Glyph: SiGooglemeet, from: "#5aa85f", to: "#00897b" },
  "google sheets": { Glyph: SiGooglesheets, from: "#3fbf70", to: "#0f9d58" },
  "google slides": { Glyph: SiGoogleslides, from: "#ffcf4d", to: "#f4b400" },
  "google classroom": { Glyph: SiGoogleclassroom, from: "#5aa85f", to: "#0f9d58" },
  "google scholar": { Glyph: SiGooglescholar, from: "#5a9bff", to: "#4285f4" },
  "google keep": { Glyph: SiGooglekeep, from: "#ffe14d", to: "#fbbc04" },
  "google forms": { Glyph: SiGoogleforms, from: "#9b6bd6", to: "#7248b9" },
  "google colab": { Glyph: SiGooglecolab, from: "#ffba4d", to: "#f9ab00" },
  "google news": { Glyph: SiGooglenews, from: "#5a9bff", to: "#4285f4" },
  // short aliases used by the Google apps launcher
  maps: { Glyph: SiGooglemaps, from: "#5aa85f", to: "#34a853" },
  drive: { Glyph: SiGoogledrive, from: "#ffd24d", to: "#f4b400" },
  translate: { Glyph: SiGoogletranslate, from: "#5a9bff", to: "#4285f4" },
  photos: { Glyph: SiGooglephotos, from: "#5a9bff", to: "#4285f4" },
  calendar: { Glyph: SiGooglecalendar, from: "#5a9bff", to: "#4285f4" },
  docs: { Glyph: SiGoogledocs, from: "#5a9bff", to: "#2a72e0" },
  play: { Glyph: SiGoogleplay, from: "#4fd6c4", to: "#00b3a6" },
  meet: { Glyph: SiGooglemeet, from: "#5aa85f", to: "#00897b" },
  sheets: { Glyph: SiGooglesheets, from: "#3fbf70", to: "#0f9d58" },
  slides: { Glyph: SiGoogleslides, from: "#ffcf4d", to: "#f4b400" },
  classroom: { Glyph: SiGoogleclassroom, from: "#5aa85f", to: "#0f9d58" },
  scholar: { Glyph: SiGooglescholar, from: "#5a9bff", to: "#4285f4" },
  keep: { Glyph: SiGooglekeep, from: "#ffe14d", to: "#fbbc04" },
  forms: { Glyph: SiGoogleforms, from: "#9b6bd6", to: "#7248b9" },
  colab: { Glyph: SiGooglecolab, from: "#ffc04d", to: "#f9ab00" },
  account: { Glyph: LuUser, from: "#8a94a6", to: "#5b6472" },
  contacts: { Glyph: LuUser, from: "#5a9bff", to: "#4285f4" },
  "google contacts": { Glyph: LuUser, from: "#5a9bff", to: "#4285f4" },
  passwords: { Glyph: LuKeyRound, from: "#5aa85f", to: "#0f9d58" },
  "google passwords": { Glyph: LuKeyRound, from: "#5aa85f", to: "#0f9d58" },
  books: { Glyph: LuBookOpen, from: "#5a9bff", to: "#4285f4" },
  "google books": { Glyph: LuBookOpen, from: "#5a9bff", to: "#4285f4" },
  drawing: { Glyph: LuPencilRuler, from: "#ff8a5a", to: "#e8710a" },
  jamboard: { Glyph: LuPresentation, from: "#ffb64d", to: "#f9ab00" },
  "play games": { Glyph: LuGamepad2, from: "#5a9bff", to: "#4285f4" },
};

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// A rounded "app icon" tile with a brand glyph or a monogram fallback.
function IconTile({
  name = "",
  size = 56,
  colorful = true,
  showGlyph = true,
  bare = false,
}) {
  const key = name.toLowerCase().trim();
  const brand = BRANDS[key];
  const hue = hashHue(key || "?");
  const Glyph = brand?.Glyph;
  const letter = (name || "?").trim()[0]?.toUpperCase() || "?";

  // "bare" = just the coloured glyph, no tile background (used in the search box).
  if (bare) {
    const color = brand ? brand.to : `hsl(${hue} 70% 52%)`;
    return Glyph ? (
      <Glyph size={size} color={color} aria-hidden />
    ) : (
      <span
        className="icon-tile-letter"
        style={{ fontSize: size, color, textShadow: "none" }}
      >
        {letter}
      </span>
    );
  }

  const gradient = !colorful
    ? "linear-gradient(160deg, rgba(255,255,255,0.85), rgba(235,235,235,0.85))"
    : brand
    ? `linear-gradient(160deg, ${brand.from}, ${brand.to})`
    : `linear-gradient(160deg, hsl(${hue} 72% 64%), hsl(${(hue + 28) % 360} 68% 48%))`;
  const TileGlyph = showGlyph && colorful ? Glyph : null;

  return (
    <div
      className="icon-tile"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: gradient,
      }}
    >
      {TileGlyph ? (
        <TileGlyph size={Math.round(size * 0.5)} color="#fff" aria-hidden />
      ) : (
        <span className="icon-tile-letter" style={{ fontSize: size * 0.42 }}>
          {letter}
        </span>
      )}
    </div>
  );
}

export default IconTile;
