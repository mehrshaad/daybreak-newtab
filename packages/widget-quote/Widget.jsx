import { useMemo } from "react";
import { quoteForDay } from "./quotes";

function Quote({ options }) {
  // Recomputed only when the tile remounts; the quote is stable for the day
  // regardless, so there is nothing to tick.
  const quote = useMemo(() => quoteForDay(), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      <p
        className="db-selectable"
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg)",
          textWrap: "pretty",
        }}
      >
        “{quote.text}”
      </p>
      {options.hideAuthor ? null : (
        <p style={{ margin: 0, fontSize: 12, color: "var(--faint)" }}>
          — {quote.author}
        </p>
      )}
    </div>
  );
}

export default Quote;
