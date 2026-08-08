import { useState } from "react";
import { faviconUrl } from "../favicon";

// A real site icon when Chrome has one cached, or the caller's own fallback —
// never a broken-image glyph. `faviconUrl` already returns null outside the
// packaged extension (no chrome.runtime); this also catches a cache miss or a
// load failure, both of which surface as the <img>'s error event.
function Favicon({ url, size = 16, fallback = null, style }) {
  const [failed, setFailed] = useState(false);
  const src = url ? faviconUrl(url, size) : null;

  if (!src || failed) return fallback;

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      style={{ display: "block", flex: "none", borderRadius: 3, ...style }}
    />
  );
}

export default Favicon;
