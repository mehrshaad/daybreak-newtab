import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FLIP_ITEMS } from "./useFlip";

// Realtime reordering with pointer events instead of HTML5 drag-and-drop.
//
// HTML5 DnD hands the browser a translucent ghost image and only reports where
// it landed — the real element never moves. Here the element itself follows the
// pointer, and the order is rewritten as soon as the pointer enters a
// neighbour's box, so the other tiles reflow underneath while you are still
// holding it (FLIP animates that part).
//
// The geometry, which is the fiddly bit: at grab time the element's layout
// centre is G and the pointer is at P0. We want the element to track the
// pointer exactly, so its visual centre should always be G + (P - P0). A
// reorder moves the element's *layout* centre to L, so the transform it needs
// is (G + (P - P0)) - L. L is re-measured after every reorder; without that
// term the tile jumps by the width of the slot it just swapped into.

const START_THRESHOLD = 5; // px before a press becomes a drag, so clicks survive

// How long a dropped item takes to travel from under the pointer into the slot
// it landed in. Shorter than a FLIP so the tile arrives before, or with, the
// neighbours settling around it rather than trailing them.
const SETTLE_MS = 190;
const SETTLE_EASING = "cubic-bezier(.2,.8,.2,1)";

const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Measure the element's untransformed layout box. Clearing and restoring the
// transform inside one task means nothing is painted in between.
const measureLayoutRect = (node) => {
  const applied = node.style.transform;
  node.style.transform = "";
  const rect = node.getBoundingClientRect();
  node.style.transform = applied;
  return rect;
};

// L — where the element's layout centre is *now*.
const rebase = (s) => {
  const rect = measureLayoutRect(s.node);
  s.layoutX = rect.left + rect.width / 2;
  s.layoutY = rect.top + rect.height / 2;
};

const apply = (s, clientX, clientY) => {
  s.lastX = clientX;
  s.lastY = clientY;
  const tx = s.grabX + (clientX - s.startX) - s.layoutX;
  const ty = s.grabY + (clientY - s.startY) - s.layoutY;
  s.node.style.transform = `translate(${tx}px, ${ty}px)`;
};

export const pointInRect = (rect, x, y) =>
  !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

// Which frozen slot the pointer is over, or -1. Slot geometry is captured once
// at drag start precisely so this stays a pure function of the pointer.
export function slotIndexAt(slots, x, y) {
  return slots.findIndex((r) => pointInRect(r, x, y));
}

// Grace margin, in pixels, before a drag past the container's edge counts as
// "outside" — without it, reordering the last item in a row would flicker
// into delete territory the instant the pointer crosses the boundary.
const OUTSIDE_MARGIN = 24;

export function isOutsideBounds(rect, x, y, margin = OUTSIDE_MARGIN) {
  if (!rect) return false;
  return (
    x < rect.left - margin ||
    x > rect.right + margin ||
    y < rect.top - margin ||
    y > rect.bottom + margin
  );
}

export function usePointerReorder({ ids, onReorder, onDropOutside, enabled = true, containerRef }) {
  const [draggingId, setDraggingId] = useState(null);
  const [isOutside, setIsOutside] = useState(false);
  const state = useRef(null);

  // Latest order and callbacks, without re-binding the window listeners.
  const latest = useRef({ ids, onReorder, onDropOutside });
  latest.current = { ids, onReorder, onDropOutside };

  // A drop still easing home, so a fresh grab can cut it short rather than
  // have its cleanup land in the middle of the new drag.
  const settling = useRef(null);

  const endSettle = useCallback(() => {
    const st = settling.current;
    if (!st) return;
    settling.current = null;
    clearTimeout(st.timer);
    st.anim?.cancel();
    st.node.style.zIndex = "";
    st.node.style.willChange = "";
    st.node.style.transition = "";
    setDraggingId(null);
  }, []);

  const finish = useCallback(() => {
    const s = state.current;
    state.current = null;
    document.body.style.userSelect = "";
    setIsOutside(false);

    const node = s?.node;
    if (!node) {
      setDraggingId(null);
      return;
    }
    node.style.cursor = "";
    node.style.pointerEvents = "";

    // The held tile sits under the pointer, while its slot is wherever the
    // last reorder left it — so at the moment of release the transform is
    // still whatever is left of the grab offset, and dropping it outright
    // teleports the tile that far in a single frame. Ease it into the slot
    // instead. A press that never became a drag has no offset to settle, and
    // neither does one released exactly on its slot.
    const held = s.active ? node.style.transform : "";
    endSettle();
    node.style.transform = "";
    if (!held || !node.animate || reducedMotion()) {
      node.style.zIndex = "";
      node.style.willChange = "";
      node.style.transition = "";
      setDraggingId(null);
      return;
    }

    // WAAPI rather than a transition: this outranks the inline style React
    // rewrites as the tile drops out of its dragging state, so the settle
    // cannot be cancelled halfway by an unrelated re-render.
    const anim = node.animate(
      [{ transform: held }, { transform: "none" }],
      { duration: SETTLE_MS, easing: SETTLE_EASING, fill: "none" }
    );
    // Still counts as dragging until it has actually arrived: that keeps the
    // tile above its neighbours, keeps FLIP's hands off it, and keeps the
    // board's overflow open — which would otherwise snap back to `clip` and
    // cut the tile off mid-flight if it was released overhanging the grid.
    const land = () => {
      const st = settling.current;
      if (!st || st.anim !== anim) return;
      settling.current = null;
      clearTimeout(st.timer);
      // A no-op once it has played out. It matters when the backstop below is
      // what got here: the animation is then frozen part-way — a background
      // tab does not advance it — and leaving it alive would keep applying
      // that half-finished offset to a tile that is no longer being dragged.
      anim.cancel();
      node.style.zIndex = "";
      node.style.willChange = "";
      node.style.transition = "";
      setDraggingId(null);
    };
    settling.current = {
      node,
      anim,
      // A backstop, because `finished` never settles while the tab is in the
      // background — animations do not advance there. Without it, dropping a
      // tile and immediately switching away would leave it stuck lifted and
      // still flagged as dragging until the tab was looked at again.
      timer: setTimeout(land, SETTLE_MS + 120),
    };
    anim.finished.catch(() => {}).then(land);
  }, [endSettle]);

  // Nothing should outlive the component that started it.
  useEffect(() => endSettle, [endSettle]);

  const onPointerDown = useCallback(
    (event, id, dragNode) => {
      if (!enabled) return;
      if (event.button != null && event.button !== 0) return;
      // Ignore presses on a control *inside* the item (a tile's resize pill,
      // for example) but not on the item itself — icon-grid items are buttons,
      // so a blanket check would block every icon drag.
      const control = event.target.closest("button, a, input, textarea, select");
      if (control && control !== event.currentTarget) return;

      // Grabbing again mid-settle: land the previous drop now, so its cleanup
      // cannot fire part-way through this one and so the node starts from a
      // known state rather than inheriting a running animation.
      endSettle();

      // Most callers attach onPointerDown directly to the thing that should
      // move (an icon-grid item, a world-clock row), so event.currentTarget is
      // it. A tile's drag now starts from a small handle at its edge, so the
      // node that should actually translate is passed explicitly instead.
      const node = dragNode || event.currentTarget;
      const rect = node.getBoundingClientRect();
      state.current = {
        id,
        node,
        startX: event.clientX,
        startY: event.clientY,
        grabX: rect.left + rect.width / 2, // G — fixed for the whole drag
        grabY: rect.top + rect.height / 2,
        layoutX: rect.left + rect.width / 2, // L — re-measured after each reorder
        layoutY: rect.top + rect.height / 2,
        lastX: event.clientX,
        lastY: event.clientY,
        slots: [], // frozen slot geometry, filled when the drag activates
        containerRect: null, // also frozen at activation, for the outside test
        outside: false,
        // Index this drag has asked for and is waiting to see committed.
        pending: null,
        active: false,
      };
    },
    [enabled, endSettle]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    const onMove = (event) => {
      const s = state.current;
      if (!s) return;

      if (!s.active) {
        if (Math.hypot(event.clientX - s.startX, event.clientY - s.startY) < START_THRESHOLD)
          return;
        s.active = true;
        // Freeze the slot geometry now, before anything moves.
        const container = containerRef.current;
        s.slots = container
          ? [...container.querySelectorAll(FLIP_ITEMS)].map((el) =>
              el.getBoundingClientRect()
            )
          : [];
        s.containerRect = container ? container.getBoundingClientRect() : null;
        s.node.style.zIndex = "40";
        s.node.style.cursor = "grabbing";
        s.node.style.willChange = "transform";
        // Keeps the held tile from taking hover states off its neighbours.
        s.node.style.pointerEvents = "none";
        // The tile is positioned by hand from here on; no transition to fight.
        s.node.style.transition = "box-shadow .2s ease";
        document.body.style.userSelect = "none";
        setDraggingId(s.id);
      }

      event.preventDefault();
      apply(s, event.clientX, event.clientY);

      // Past the container's edge (plus a grace margin) is a delete zone, not
      // a reorder target. Callers that don't offer drop-to-delete never see
      // this: without onDropOutside there is nothing for it to trigger.
      const outside = isOutsideBounds(s.containerRect, event.clientX, event.clientY);
      if (outside !== s.outside) {
        s.outside = outside;
        setIsOutside(outside);
      }
      if (outside) return;

      // Target index comes from the SLOT the pointer is over, using geometry
      // captured once at drag start — not from whichever element happens to be
      // under the pointer right now.
      //
      // Hit-testing live elements feeds back on itself: a swap shifts every
      // item, so the next pointermove finds a different neighbour in the same
      // spot and swaps again, walking the item to the end of the list. Slot
      // geometry, by contrast, is fixed for the duration of the drag — a grid's
      // cells stay put and only their occupants change — so "pointer is over
      // slot 3" resolves to index 3 and stays there.
      const slot = slotIndexAt(s.slots, event.clientX, event.clientY);
      if (slot === -1) return;

      // One reorder at a time. `latest.current.ids` only catches up when the
      // new order is committed, so acting on it again before then would compute
      // `from` against a stale order and move the item twice.
      if (s.pending !== null) return;

      const { ids: order, onReorder: reorder } = latest.current;
      const from = order.indexOf(s.id);
      if (from === -1 || from === slot) return;

      s.pending = slot;
      reorder(from, slot);
    };

    const onUp = () => {
      const s = state.current;
      if (s?.active && s.outside) latest.current.onDropOutside?.(s.id);
      if (s) finish();
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [enabled, containerRef, finish]);

  // Re-base as soon as the new order is committed, and put the item back under
  // the cursor in the same frame.
  //
  // This has to be a layout effect. Doing it in requestAnimationFrame was the
  // bug behind the held tile jumping a slot away from the pointer as soon as it
  // passed a neighbour: pointermove is a continuous event, so React commits the
  // reorder in a scheduler callback that can run *after* the frame callback. The
  // measurement was then taken against the old layout, and since L is only read
  // here, the item stayed a whole slot out for the rest of the drag.
  const orderKey = ids.join("|");
  useLayoutEffect(() => {
    const s = state.current;
    if (!s) return;
    s.pending = null;
    if (!s.active || !s.node) return;
    rebase(s);
    apply(s, s.lastX, s.lastY);
  }, [orderKey]);

  // Leaving edit mode mid-drag must not strand a floating tile.
  useEffect(() => {
    if (!enabled && state.current) finish();
  }, [enabled, finish]);

  return { draggingId, isOutside, onPointerDown };
}

// Move an item within an array, returning a new array.
export function moveItem(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
