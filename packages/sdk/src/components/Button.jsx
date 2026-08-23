import { forwardRef } from "react";
import { useHover } from "../useHover";
import { CONTROL_TRANSITION } from "../styles";

// A button that reacts to the pointer.
//
// In the SDK rather than in the app because widgets have buttons too, and while
// this lived in src/components the widget packages could not reach it — so each
// one wrote its own, and a good few of them forgot the hover state entirely.
// One implementation is also one place the hover ends correctly: useHover drops
// the highlight when the pointer leaves the window or when the button is
// removed from under a cursor that never moved.
//
// `styleFor` is one of the style factories (softButton, roundControl,
// primaryButton), `style` its overrides, and `hover` what changes while the
// pointer is on it.
// Forwards its ref, because several of these are also a tooltip's anchor or a
// popover's, and those need the element. Safe to hand out: useHover takes its
// node from the mouseenter event rather than from a ref of its own, so nothing
// here is competing for it.
const Button = forwardRef(function Button(
  { children, styleFor, hover, style, ...rest },
  ref
) {
  const [hovered, bind] = useHover();
  const base = styleFor ? styleFor(style) : style;
  return (
    <button
      ref={ref}
      type="button"
      // First so a caller's own transition still wins.
      style={{ transition: CONTROL_TRANSITION, ...base, ...(hovered ? hover : null) }}
      {...bind}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
