import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NoticeContext } from "./noticeContext";
import { useSettings } from "./settingsContext";
import {
  addNotice,
  EXIT_MS,
  freezeNotice,
  isSilenced,
  leaveNotice,
  leavingIds,
  makeNotice,
  removeNotice,
  tickNotices,
} from "./notices";

// One place anything in the app can say something, and one place the user can
// tell it to be quiet. See notices.js for the queue's own rules.

// The countdown border needs to move, but not on every frame — a notice lives
// for seconds and its border is a few hundred pixels wide, so this is already
// finer than anyone can see.
const TICK = 100;

export function NoticeProvider({ children }) {
  const { settings } = useSettings();
  const [notices, setNotices] = useState([]);
  // Read through a ref so `notify` never changes identity: it ends up in the
  // dependency list of effects all over the app, and a new function each
  // render would refetch and re-run half of them.
  const silenced = useRef(settings);
  silenced.current = settings;

  // Dismissing marks the card as leaving; the removal comes after the fade.
  // See EXIT_MS: a notice cut straight out of the list cannot animate, and the
  // two below it jumping up into the gap is what made it look like a glitch.
  const dismiss = useCallback((id) => {
    setNotices((list) => leaveNotice(list, id));
  }, []);

  const notify = useCallback((input) => {
    const notice = makeNotice(typeof input === "string" ? { message: input } : input);
    if (isSilenced(silenced.current, notice.category)) return null;
    setNotices((list) => addNotice(list, notice));
    return notice.id;
  }, []);

  const freeze = useCallback((id, frozen) => {
    setNotices((list) => freezeNotice(list, id, frozen));
  }, []);

  // A single interval for the whole stack rather than a timer per notice: with
  // one timer each, freezing one meant cancelling and re-creating it, and the
  // remaining time had to be reconstructed from when it started.
  //
  // A notice whose countdown runs out is marked leaving rather than dropped, so
  // it fades the same way a dismissed one does.
  useEffect(() => {
    if (!notices.length) return undefined;
    const id = setInterval(() => {
      setNotices((list) => {
        const { list: next, expired } = tickNotices(list, TICK);
        return expired.reduce((acc, noticeId) => leaveNotice(acc, noticeId), next);
      });
    }, TICK);
    return () => clearInterval(id);
    // Only whether the stack is empty matters — restarting the interval on
    // every tick would reset the countdown forever.
  }, [notices.length]);

  // Whatever is leaving gets taken out once its fade has played. Keyed on the
  // ids rather than the list, so an unrelated re-render does not restart a
  // timer that is already counting one of them out.
  const leaving = leavingIds(notices).join(",");
  useEffect(() => {
    if (!leaving) return undefined;
    const ids = leaving.split(",").map(Number);
    const timer = setTimeout(() => {
      setNotices((list) => ids.reduce((acc, id) => removeNotice(acc, id), list));
    }, EXIT_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  // A way to raise a notice from the console while the dev server is running.
  // Half these categories only fire when something has actually gone wrong —
  // sync failing, an update landing — which makes "does the stack look right"
  // an awkward thing to check by hand. Stripped from the built extension:
  // import.meta.env.DEV is false there and the whole effect is dropped.
  useEffect(() => {
    if (!import.meta.env?.DEV) return undefined;
    window.notify = notify;
    return () => {
      delete window.notify;
    };
  }, [notify]);

  const value = useMemo(
    () => ({ notices, notify, dismiss, freeze }),
    [notices, notify, dismiss, freeze]
  );

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}
