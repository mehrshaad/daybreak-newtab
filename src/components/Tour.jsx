import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { clampToViewport, MONO, usePresence } from "@daybreak/sdk";
import {
  emphasise,
  isLast,
  nextIndex,
  prevIndex,
  stepAt,
  targetsOf,
  TOUR_STEPS,
  usableSteps,
} from "../core/tour";
import Celebration from "./Celebration";
import { Button } from "./primitives";

// The guided tour.
//
// A spotlight rather than a slideshow: the point of the tour is "here is where
// that lives", and a picture of the settings drawer cannot say where the
// settings drawer is. So it dims the page around the real element and leaves
// the element itself lit.
//
// Lit, but not live. The first version left the hole genuinely open so somebody
// could try the thing being described — which sounds generous and is not: every
// step puts the app into a particular state, so a click on the lit element
// changes that state out from under the next step, and the spotlight then
// points confidently at the wrong thing. A tour you can break by using it is
// worse than one you sit through. So a transparent sheet covers everything,
// including the hole, and the only live thing on screen is the card.
//
// The dimming is four panels around the hole rather than one scrim with a
// clip-path: same picture, and no clip-path support to worry about.

const EXIT_MS = 180;
const PAD = 8;
const CARD_WIDTH = 340;
const GAP = 14;

function elementFor(name) {
  return name ? document.querySelector(`[data-tour="${name}"]`) : null;
}

// The box around everything a step wants lit. Several handles collapse into one
// hole rather than several, because some ideas are one idea spread across three
// controls — "how it looks" is the theme, the accent and the background, and
// three separate spotlights would read as three separate points.
function spotlightRect(names) {
  let box = null;
  for (const name of names) {
    const el = elementFor(name);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    box = box
      ? {
          top: Math.min(box.top, r.top),
          left: Math.min(box.left, r.left),
          right: Math.max(box.right, r.right),
          bottom: Math.max(box.bottom, r.bottom),
        }
      : { top: r.top, left: r.left, right: r.right, bottom: r.bottom };
  }
  if (!box) return null;
  return { ...box, width: box.right - box.left, height: box.bottom - box.top };
}

// Bring the target into view before measuring it. Half the steps point at
// something inside the settings drawer, which scrolls — and a spotlight on a
// section three screens down is a dimmed page with a hole in it nobody can see.
// Instant rather than smooth: a smooth scroll is still moving when the card is
// positioned, and the card would land where the target used to be.
function revealTargets(names) {
  for (const name of names) {
    const el = elementFor(name);
    if (el?.scrollIntoView) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      // The first one is enough: multi-target steps name neighbours, and
      // scrolling to each in turn would leave the last one centred and the
      // first one off the top.
      return;
    }
  }
}

// Where the card goes relative to the hole, given which way the step asked for
// and how much room there actually is. Asking for "left" against the left edge
// of the window has to give way, or the card ends up half off-screen with the
// text unreadable.
function placeCard(rect, placement, cardHeight) {
  const space = {
    top: rect.top,
    bottom: window.innerHeight - rect.bottom,
    left: rect.left,
    right: window.innerWidth - rect.right,
  };
  const fits = {
    top: space.top >= cardHeight + GAP,
    bottom: space.bottom >= cardHeight + GAP,
    left: space.left >= CARD_WIDTH + GAP,
    right: space.right >= CARD_WIDTH + GAP,
  };
  // The asked-for side first, then whichever has the most room.
  const order = [placement, "bottom", "top", "right", "left"].filter(Boolean);
  const side = order.find((s) => fits[s]) || "bottom";

  if (side === "left") {
    return { x: rect.left - CARD_WIDTH - GAP, y: rect.top };
  }
  if (side === "right") {
    return { x: rect.right + GAP, y: rect.top };
  }
  const x = rect.left + rect.width / 2 - CARD_WIDTH / 2;
  return { x, y: side === "top" ? rect.top - cardHeight - GAP : rect.bottom + GAP };
}

function Tour({ open, onClose, onScene, hasWidgets = true }) {
  const [present, closing] = usePresence(open, EXIT_MS);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [cardPos, setCardPos] = useState(null);
  const cardRef = useRef(null);

  // Filtered on what the board has, not on what is on screen right now — see
  // usableSteps. A target that happens to be missing when its step comes up
  // simply gets a centred card with no spotlight, which the measuring below
  // already handles.
  const steps = useMemo(() => usableSteps(TOUR_STEPS, { hasWidgets }), [hasWidgets]);
  const step = stepAt(steps, index);

  // Put the app into the state this step is about, before anything is measured.
  // A layout effect and not an ordinary one: the drawer has to be open before
  // the spotlight goes looking for something inside it.
  useLayoutEffect(() => {
    if (!present || !step) return;
    // The step id goes with the scene: a couple of steps want more than a mode,
    // and the alternative is a second callback for every one of them.
    onScene?.(step.scene, step.id);
  }, [present, step, onScene]);

  const measure = useCallback(() => {
    if (!step) return;
    const names = targetsOf(step);
    revealTargets(names);
    const found = spotlightRect(names);
    setRect(found);
    const height = cardRef.current?.offsetHeight || 200;
    if (!found) {
      // No target: the card sits in the middle and nothing is cut out.
      setCardPos({
        x: window.innerWidth / 2 - CARD_WIDTH / 2,
        y: window.innerHeight / 2 - height / 2,
      });
      return;
    }
    const wanted = placeCard(found, step.placement, height);
    // clampToViewport speaks {left, top}; everything here speaks {x, y}, and
    // reading .x off it silently gave undefined — which fell through to the
    // -9999 parking spot below, so every step with a target rendered its card
    // off screen while the spotlight landed correctly. Converted once, here.
    const clamped = clampToViewport(wanted.x, wanted.y, CARD_WIDTH, height, 16);
    setCardPos({ x: clamped.left, y: clamped.top });
  }, [step]);

  // Twice, deliberately. The first pass positions the card from an estimated
  // height; the second runs once it has been laid out and knows the real one.
  // Without it a tall card opening near the bottom is measured short and hangs
  // off the screen.
  useLayoutEffect(() => {
    if (!present) return undefined;
    measure();
    const again = requestAnimationFrame(measure);
    const later = setTimeout(measure, 220);
    return () => {
      cancelAnimationFrame(again);
      clearTimeout(later);
    };
  }, [present, measure]);

  useEffect(() => {
    if (!present) return undefined;
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { capture: true, passive: true });
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, { capture: true });
    };
  }, [present, measure]);

  const finish = useCallback(() => {
    setIndex(0);
    onScene?.("board");
    onClose();
  }, [onClose, onScene]);

  useEffect(() => {
    if (!present) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => nextIndex(steps, i));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setIndex((i) => prevIndex(i));
        return;
      }
      // Enter means "carry on", wherever focus happens to be — a card you read
      // and dismiss with one key is the whole point of it being a card. On the
      // last step it finishes.
      //
      // Which leaves Space as "press the button I am on", so Back and Skip are
      // still reachable from the keyboard. That is the ordinary split in a
      // wizard, and taking Enter for the primary action is why the primary
      // button is the one that gets focus.
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (isLast(steps, index)) finish();
        else setIndex((i) => nextIndex(steps, i));
        return;
      }
      // Tab moves between the card's own buttons; Space presses one.
      if (["Tab", " "].includes(e.key)) return;
      // Everything else is swallowed. Ctrl K, Alt E and Alt A all change the
      // state the current step was written for, and the sealed sheet above
      // stops the mouse doing that but not the keyboard.
      e.preventDefault();
      e.stopPropagation();
    };
    // Capture, so this runs before the app's own shortcuts rather than after.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [present, steps, index, finish]);

  // Focus starts and stays on the card, so Tab cycles its buttons rather than
  // wandering into a board nobody can click anyway, and Enter advances.
  //
  // The Next button by name, not "the last button in the card": that selector
  // found the last progress dot instead — :last-of-type matches per parent and
  // querySelector takes the first such match in the document — so the ring sat
  // on the fifteenth dot and Enter jumped to the end of the tour.
  useEffect(() => {
    if (!present) return;
    const card = cardRef.current;
    if (!card || card.contains(document.activeElement)) return;
    card.querySelector("[data-tour-primary]")?.focus?.();
  }, [present, index]);

  if (!present || !step) return null;

  const last = isLast(steps, index);
  const hole = rect
    ? {
        top: Math.max(0, rect.top - PAD),
        left: Math.max(0, rect.left - PAD),
        right: Math.min(window.innerWidth, rect.right + PAD),
        bottom: Math.min(window.innerHeight, rect.bottom + PAD),
      }
    : null;

  const scrim = "rgba(6,7,10,.58)";
  // Purely visual now — the blocker below is what actually catches the pointer,
  // so these do not need to and must not, or the hole would be a live gap in an
  // otherwise sealed sheet.
  const panel = (style) => (
    <div style={{ position: "fixed", background: scrim, pointerEvents: "none", ...style }} />
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Daybreak tour"
      style={{
        position: "fixed",
        inset: 0,
        // Above the store (70) and the context menu (80), below the tooltips
        // (100) so a tooltip inside a highlighted control still shows.
        zIndex: 95,
        pointerEvents: "none",
        animation: closing ? `db-out ${EXIT_MS}ms ease both` : "db-fade .22s ease both",
      }}
    >
      {/* One transparent sheet over the whole window, the hole included. This
          is what makes the tour modal: clicking the lit element would change
          the state the next step is written for, and clicking the dim area
          should not dismiss anything — there is a Skip for that. */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "auto" }} />

      {hole ? (
        <>
          {panel({ top: 0, left: 0, right: 0, height: hole.top })}
          {panel({ top: hole.bottom, left: 0, right: 0, bottom: 0 })}
          {panel({ top: hole.top, left: 0, width: hole.left, height: hole.bottom - hole.top })}
          {panel({
            top: hole.top,
            left: hole.right,
            right: 0,
            height: hole.bottom - hole.top,
          })}
          {/* A ring around the lit element, so the edge of the hole reads as
              deliberate rather than as the dimming having failed there. */}
          <div
            style={{
              position: "fixed",
              top: hole.top,
              left: hole.left,
              width: hole.right - hole.left,
              height: hole.bottom - hole.top,
              borderRadius: 12,
              boxShadow: "0 0 0 2px var(--accentLine)",
              pointerEvents: "none",
              transition: "top .24s cubic-bezier(.2,.8,.2,1), left .24s cubic-bezier(.2,.8,.2,1), width .24s, height .24s",
            }}
          />
        </>
      ) : (
        panel({ inset: 0 })
      )}

      {/* Fired from behind the card on the last step, which is where the eye
          already is. */}
      {step.celebrate && cardPos ? (
        <Celebration x={cardPos.x + CARD_WIDTH / 2} y={cardPos.y + 60} />
      ) : null}

      <div
        ref={cardRef}
        style={{
          position: "fixed",
          left: cardPos?.x ?? -9999,
          top: cardPos?.y ?? -9999,
          width: CARD_WIDTH,
          maxWidth: "calc(100vw - 32px)",
          padding: "16px 18px",
          borderRadius: 16,
          background: "var(--sheet)",
          border: "1px solid var(--line)",
          backdropFilter: "var(--blur-sheet)",
          boxShadow: "0 30px 70px rgba(0,0,0,.45)",
          pointerEvents: "auto",
          transition: "left .24s cubic-bezier(.2,.8,.2,1), top .24s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--accentText)",
            marginBottom: 8,
          }}
        >
          {index + 1} of {steps.length}
        </div>
        <div style={{ fontSize: 16, fontWeight: 500, color: "var(--fg)", marginBottom: 6 }}>
          {step.title}
        </div>
        {/* Emphasised runs in the app's own text colour rather than a heavier
            weight alone: on a translucent card at 13px, weight on its own is
            almost invisible, and colour is what actually makes a phrase catch
            the eye when somebody is scanning rather than reading. */}
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "var(--dim)",
            // Justified, with hyphenation to go with it. A 340px column at
            // 13px is narrow enough that justification alone opens rivers of
            // white space between words; letting the browser break the long
            // ones closes them up. The last line stays ragged, which is the
            // default and the right behaviour.
            textAlign: "justify",
            hyphens: "auto",
          }}
        >
          {emphasise(step.body).map((run, i) =>
            run.strong ? (
              <strong key={i} style={{ fontWeight: 500, color: "var(--fg)" }}>
                {run.text}
              </strong>
            ) : (
              <span key={i}>{run.text}</span>
            )
          )}
        </div>

        {/* Progress as dots rather than a bar: thirteen steps is few enough to
            show, and seeing how many are left is what stops a tour feeling
            endless. On their own row, because thirteen of them beside three
            buttons wrapped onto two lines and looked like a mistake. */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginTop: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            {steps.map((s, i) => (
              <Button
                key={s.id}
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                // They are a way back to any step, not just a read-out of where
                // you are, so they have to look like something you can press.
                hover={i === index ? { opacity: 0.85 } : { background: "var(--dim)" }}
                style={{
                  width: i === index ? 16 : 6,
                  height: 6,
                  padding: 0,
                  border: 0,
                  borderRadius: 999,
                  cursor: "pointer",
                  background: i === index ? "var(--accent)" : "var(--line)",
                  transition: "width .2s ease, background .2s ease",
                }}
              />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1 }} />
          <Button
            onClick={finish}
            style={{
              padding: "7px 12px",
              borderRadius: 999,
              fontSize: 12,
              cursor: "pointer",
              background: "transparent",
              border: 0,
              color: "var(--faint)",
              flex: "none",
            }}
            hover={{ background: "var(--panel2)", color: "var(--fg)" }}
          >
            {last ? "" : "Skip"}
          </Button>
          {index > 0 ? (
            <Button
              onClick={() => setIndex((i) => prevIndex(i))}
              style={{
                padding: "7px 13px",
                borderRadius: 999,
                fontSize: 12,
                cursor: "pointer",
                background: "var(--panel2)",
                border: "1px solid var(--line)",
                color: "var(--fg)",
                flex: "none",
              }}
              hover={{ background: "var(--sheetHover)" }}
            >
              Back
            </Button>
          ) : null}
          <Button
            data-tour-primary=""
            onClick={() => (last ? finish() : setIndex((i) => nextIndex(steps, i)))}
            style={{
              padding: "7px 15px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              background: "var(--accent)",
              border: 0,
              color: "var(--onAccent)",
              flex: "none",
            }}
            hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
          >
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Tour;
