import { useMemo } from "react";
import { quoteForDay } from "./quotes";

function Quote({ options, focused }) {
  // Recomputed only when the tile remounts; the quote is stable for the day
  // regardless, so there is nothing to tick.
  const quote = useMemo(() => quoteForDay(), []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: focused ? "center" : "flex-start",
        textAlign: focused ? "center" : "left",
        gap: focused ? "clamp(12px, 2.5vh, 28px)" : 10,
        flex: 1,
        minWidth: 0,
        padding: focused ? "0 clamp(16px, 8vw, 140px)" : 0,
      }}
    >
      <p
        style={{
          margin: 0,
          // Zoomed, the quote is the whole point of the card, so let it grow
          // into the space instead of sitting small in a large empty box.
          fontSize: focused ? "clamp(24px, 3.6vw, 56px)" : 14,
          fontWeight: focused ? 500 : 400,
          letterSpacing: focused ? "-.02em" : 0,
          lineHeight: focused ? 1.3 : 1.55,
          color: "var(--fg)",
          textWrap: "pretty",
        }}
      >
        “{quote.text}”
      </p>
      {options.hideAuthor ? null : (
        <p
          className={focused ? "db-reveal" : undefined}
          style={{
            margin: 0,
            fontSize: focused ? "clamp(13px, 1.4vw, 20px)" : 12,
            color: "var(--faint)",
          }}
        >
          — {quote.author}
        </p>
      )}
    </div>
  );
}

export default Quote;
