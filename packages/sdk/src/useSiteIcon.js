import { useEffect, useState } from "react";
import { siteIcon } from "./siteIcon";

// The site's real icon, once we have confirmed Chrome actually has one — null
// until then, and null forever where it does not, so the caller keeps whatever
// it draws in the meantime rather than flashing an empty square.
export function useSiteIcon(pageUrl) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    setSrc(null);
    if (!pageUrl) return undefined;
    let live = true;
    siteIcon(pageUrl).then((found) => {
      if (live) setSrc(found);
    });
    return () => {
      live = false;
    };
  }, [pageUrl]);

  return src;
}
