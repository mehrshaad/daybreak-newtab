import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NoticeContext } from "./noticeContext";
import { useSettings } from "./settingsContext";
import {
  addNotice,
  freezeNotice,
  isSilenced,
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

  const dismiss = useCallback((id) => {
    setNotices((list) => removeNotice(list, id));
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
  useEffect(() => {
    if (!notices.length) return undefined;
    const id = setInterval(() => {
      setNotices((list) => {
        const { list: next, expired } = tickNotices(list, TICK);
        return expired.length ? next.filter((n) => !expired.includes(n.id)) : next;
      });
    }, TICK);
    return () => clearInterval(id);
    // Only whether the stack is empty matters — restarting the interval on
    // every tick would reset the countdown forever.
  }, [notices.length]);

  const value = useMemo(
    () => ({ notices, notify, dismiss, freeze }),
    [notices, notify, dismiss, freeze]
  );

  return <NoticeContext.Provider value={value}>{children}</NoticeContext.Provider>;
}
