import { useEffect, useRef } from "react";

// Lets the tile's right-click menu reach a widget's own add form.
//
// Every widget that can gain an item had a button for it somewhere inside the
// tile, and the right-click menu — where a person looks for "add" — offered
// widget settings and a size picker and nothing else. The menu could not offer
// it because "add" is not a setting: it is the widget opening a form in its own
// body, and the host has no handle on that.
//
// So the manifest declares the action and the widget answers it. The host puts
// { name, nonce } on the tile, the nonce changes each time the item is picked,
// and this fires the handler once per change. One-way and stateless: nothing to
// clear, no acknowledgement to forget, and picking the same item twice fires
// twice, which is what the fifth "Add a city" in a row has to do.
//
// A nonce rather than a boolean because a boolean has to be set and then unset
// by whoever set it, and the unset is the half that gets forgotten — leaving a
// widget that reopens its add form on every unrelated re-render.
export function useWidgetAction(action, name, handler) {
  const nonce = action && action.name === name ? action.nonce : 0;
  // Held in a ref so a handler that closes over fresh state does not re-fire
  // the effect. The nonce is the only thing that may trigger this.
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (nonce) latest.current?.();
  }, [nonce]);
}
