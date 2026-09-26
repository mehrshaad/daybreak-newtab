import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import IconGrid from "./IconGrid";

// Which icon the open editor is about.
//
// Right-clicking an icon opens a panel with its name, address and colour in
// it. On a grid of sixteen marks at identical size, nothing said which of them
// the panel belonged to — the popover is anchored near it, but "near" is one
// cell's width on a tight grid. So the mark being edited lifts and grows, and
// holds that while the editor is open.

const ITEMS = [
  { key: "a", name: "GitHub", title: "https://github.com" },
  { key: "b", name: "MDN", title: "https://developer.mozilla.org" },
];

// The lift is on a wrapper around the mark rather than the button, so the
// label does not move and the neighbours are not shoved around.
const markOf = (name) =>
  screen.getByRole("button", { name }).querySelector("span[style*='transform']");

describe("the icon whose editor is open", () => {
  it("is lifted and enlarged", () => {
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} activeKey="a" />);
    expect(markOf("GitHub").style.transform).toContain("translateY(-3px)");
    expect(markOf("GitHub").style.transform).toContain("scale(1.14)");
  });

  it("is the only one", () => {
    // The bug this would be: every icon lifting, which says nothing at all.
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} activeKey="a" />);
    expect(markOf("MDN").style.transform).toBe("none");
  });

  it("goes back down when the editor closes", () => {
    const { rerender } = render(<IconGrid items={ITEMS} cols={4} iconSize={40} activeKey="a" />);
    rerender(<IconGrid items={ITEMS} cols={4} iconSize={40} activeKey={null} />);
    expect(markOf("GitHub").style.transform).toBe("none");
  });

  it("does not lift anything when no editor is open", () => {
    // activeKey defaults to null, and a null key must not match an item whose
    // own key is missing — that would lift a random icon on every grid.
    render(<IconGrid items={[{ key: undefined, name: "Nameless" }]} cols={4} iconSize={40} />);
    expect(markOf("Nameless").style.transform).toBe("none");
  });

  it("animates rather than snapping", () => {
    render(<IconGrid items={ITEMS} cols={4} iconSize={40} activeKey="a" />);
    expect(markOf("GitHub").style.transition).toContain("transform");
  });
});
