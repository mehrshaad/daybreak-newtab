import googleMark from "../assets/brand/google-favicon-2025.webp";
import { SiDuckduckgo, SiMicrosoftbing } from "./brandIcons";

// The three search-engine marks, on their own.
//
// The header drew these with IconTile, which resolves a name against the full
// brand table — and the header is eager, so that table and its 166 icon
// components sat in the first chunk a new tab loads, in order to draw one 15px
// mark. Every other user of the table is inside a widget, and widgets are
// lazily chunked, so lifting this one call out of the header is what lets the
// whole thing move off the critical path.
//
// The marks come from brandIcons rather than react-icons/si, and that is the
// whole point of this file: react-icons/si is one module holding the 166 icons
// the brand table uses, and a module lands in exactly one chunk. One eager
// import of one icon from it puts all 166 in the chunk a new tab loads first.
//
// Three marks hardcoded rather than a lookup, because there are three engines
// and a table of three is not a table. If a fourth is ever added, it goes here
// beside the others.
const MARKS = {
  duckduckgo: { Glyph: SiDuckduckgo, colour: "#de5833" },
  bing: { Glyph: SiMicrosoftbing, colour: "#0f6cbd" },
};

function EngineMark({ engine, size = 15 }) {
  // Google ships as artwork rather than a monochrome path, so it is drawn
  // directly instead of being tinted like the other two.
  if (engine === "google") {
    return (
      <img
        src={googleMark}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", display: "block", flex: "none" }}
      />
    );
  }
  const mark = MARKS[engine];
  if (!mark) return null;
  return <mark.Glyph size={size} color={mark.colour} aria-hidden="true" />;
}

export default EngineMark;
