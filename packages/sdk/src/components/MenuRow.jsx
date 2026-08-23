import { useHover } from "../useHover";
import { menuRow } from "../styles";

// A row in a dropdown menu, with the hover behaviour attached.
//
// A component rather than only the style factory in styles.js, because the
// hover state is the part that was missing from two of the app's three menus —
// leaving it to each caller is what let them drift in the first place. Uses the
// SDK's useHover, so a row also stops being lit when the pointer leaves the
// window or the menu closes under a stationary cursor.
//
// `hint` lights a row with no pointer near it: the tour points at a menu row
// that way, so what it is indicating is the same highlight hovering would give
// rather than a decoration invented for the occasion.
function MenuRow({ selected = false, hint = false, style, children, ...rest }) {
  const [hovered, bind] = useHover();
  return (
    <button
      type="button"
      style={menuRow({ lit: hovered || hint, selected }, style)}
      {...bind}
      {...rest}
    >
      {children}
    </button>
  );
}

export default MenuRow;
