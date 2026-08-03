import {
  SiDropbox,
  SiDuckduckgo,
  SiGithub,
  SiGmail,
  SiGoogle,
  SiGoogleanalytics,
  SiGooglecalendar,
  SiGooglechat,
  SiGooglechrome,
  SiGoogleclassroom,
  SiGooglecloud,
  SiGooglecolab,
  SiGoogledocs,
  SiGoogledrive,
  SiGoogleearth,
  SiGooglefit,
  SiGooglefonts,
  SiGoogleforms,
  SiGooglegemini,
  SiGooglehome,
  SiGooglekeep,
  SiGooglelens,
  SiGooglemaps,
  SiGooglemeet,
  SiGooglemessages,
  SiGooglenews,
  SiGooglepay,
  SiGooglephotos,
  SiGoogleplay,
  SiGooglescholar,
  SiGooglesheets,
  SiGoogleslides,
  SiGoogletasks,
  SiGoogletranslate,
  SiInstagram,
  SiLinkedin,
  SiMega,
  SiNetflix,
  SiNotion,
  SiOpenai,
  SiReddit,
  SiSlack,
  SiSpotify,
  SiTelegram,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { SiMicrosoftbing } from "./components/brandIcons";

// name -> { Glyph, from, to }. Every entry is a real brand mark: react-icons
// where it has one, and a bundled CC0 Simple Icons path where it does not
// (Bing). Nothing here is a generic stand-in — an app with no authentic mark is
// left out of the launcher rather than given a borrowed icon.
//
// The gradient and tile are the Daybreak treatment; the glyph is the brand's.
export const BRANDS = {
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
  spotify: { Glyph: SiSpotify, from: "#4ce072", to: "#1db954" },
  notion: { Glyph: SiNotion, from: "#5c5c5c", to: "#0f0f0f" },
  slack: { Glyph: SiSlack, from: "#5fd0a8", to: "#4a154b" },
  x: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },
  twitter: { Glyph: SiX, from: "#3a3a3a", to: "#000000" },

  // search engines
  google: { Glyph: SiGoogle, from: "#5a9bff", to: "#3d6fe0" },
  duckduckgo: { Glyph: SiDuckduckgo, from: "#ff7a4d", to: "#de5833" },
  bing: { Glyph: SiMicrosoftbing, from: "#4aa8ff", to: "#0f6cbd" },

  // google apps
  gmail: { Glyph: SiGmail, from: "#ff6a5b", to: "#e0392b" },
  drive: { Glyph: SiGoogledrive, from: "#ffd24d", to: "#f4b400" },
  calendar: { Glyph: SiGooglecalendar, from: "#5a9bff", to: "#4285f4" },
  meet: { Glyph: SiGooglemeet, from: "#3fbf70", to: "#00897b" },
  chat: { Glyph: SiGooglechat, from: "#3fbf70", to: "#00ac47" },
  messages: { Glyph: SiGooglemessages, from: "#5a9bff", to: "#1a73e8" },
  docs: { Glyph: SiGoogledocs, from: "#5a9bff", to: "#2a72e0" },
  sheets: { Glyph: SiGooglesheets, from: "#3fbf70", to: "#0f9d58" },
  slides: { Glyph: SiGoogleslides, from: "#ffcf4d", to: "#f4b400" },
  forms: { Glyph: SiGoogleforms, from: "#9b6bd6", to: "#7248b9" },
  keep: { Glyph: SiGooglekeep, from: "#ffe14d", to: "#fbbc04" },
  tasks: { Glyph: SiGoogletasks, from: "#5a9bff", to: "#2478f3" },
  photos: { Glyph: SiGooglephotos, from: "#5a9bff", to: "#4285f4" },
  maps: { Glyph: SiGooglemaps, from: "#5aa85f", to: "#34a853" },
  earth: { Glyph: SiGoogleearth, from: "#5a9bff", to: "#4285f4" },
  lens: { Glyph: SiGooglelens, from: "#5a9bff", to: "#4285f4" },
  translate: { Glyph: SiGoogletranslate, from: "#5a9bff", to: "#4285f4" },
  news: { Glyph: SiGooglenews, from: "#5a9bff", to: "#4285f4" },
  play: { Glyph: SiGoogleplay, from: "#4fd6c4", to: "#00b3a6" },
  classroom: { Glyph: SiGoogleclassroom, from: "#5aa85f", to: "#0f9d58" },
  scholar: { Glyph: SiGooglescholar, from: "#5a9bff", to: "#4285f4" },
  colab: { Glyph: SiGooglecolab, from: "#ffba4d", to: "#f9ab00" },
  gemini: { Glyph: SiGooglegemini, from: "#a78fd0", to: "#8e75b2" },
  chrome: { Glyph: SiGooglechrome, from: "#5a9bff", to: "#4285f4" },
  home: { Glyph: SiGooglehome, from: "#5aa85f", to: "#34a853" },
  fit: { Glyph: SiGooglefit, from: "#5a9bff", to: "#4285f4" },
  pay: { Glyph: SiGooglepay, from: "#5a9bff", to: "#4285f4" },
  analytics: { Glyph: SiGoogleanalytics, from: "#ffba4d", to: "#e8710a" },
  cloud: { Glyph: SiGooglecloud, from: "#5a9bff", to: "#4285f4" },
  fonts: { Glyph: SiGooglefonts, from: "#5a9bff", to: "#4285f4" },
  // The Google G is the authentic mark for the account entry itself.
  account: { Glyph: SiGoogle, from: "#5a9bff", to: "#3d6fe0" },
};

export function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

// Resolve a display name (or a URL host) to a brand entry.
export function brandFor(name) {
  const key = String(name || "").toLowerCase().trim();
  if (BRANDS[key]) return BRANDS[key];
  // "Google Drive" -> "drive"
  const stripped = key.replace(/^google\s+/, "");
  if (BRANDS[stripped]) return BRANDS[stripped];
  // "mail.google.com" -> "gmail", "github.com" -> "github"
  const host = key.replace(/^www\./, "").split(".")[0];
  if (BRANDS[host]) return BRANDS[host];
  return null;
}
