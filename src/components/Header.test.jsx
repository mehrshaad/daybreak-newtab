import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoticeContext } from "../core/noticeContext";
import { defaultSettings } from "../core/schema";
import { SettingsContext } from "../core/settingsContext";
import Header from "./Header";

// The bar's arithmetic lives in core/barLayout.js and core/themeCycle.js and is
// tested there. What is worth asserting here is what only exists once it is on
// screen: that a given window width actually renders the tier that width picked,
// that the theme button can get back to following the system, and that the
// engine menu can be worked without a mouse. All three regressed silently
// before, because nothing but a pair of eyes was watching them.

function mount({ width = 1920, theme = "system", editing = false } = {}) {
  window.innerWidth = width;
  const update = vi.fn();
  const settings = defaultSettings();
  settings.appearance.theme = theme;
  const props = {
    scrolled: false,
    editing,
    onToggleEdit: vi.fn(),
    onOpenStore: vi.fn(),
    onOpenSettings: vi.fn(),
    onContextMenu: vi.fn(),
    searchRef: { current: null },
  };
  render(
    <SettingsContext.Provider value={{ settings, update }}>
      <NoticeContext.Provider value={{ notices: [], notify: vi.fn(), dismiss: vi.fn(), freeze: vi.fn() }}>
        <Header {...props} />
      </NoticeContext.Provider>
    </SettingsContext.Provider>
  );
  return { update, ...props };
}

const editButton = () => screen.getByRole("button", { pressed: false, name: /edit layout/i });
const themeButton = () => screen.getByRole("button", { name: /^Theme:/ });

describe("Header, across window widths", () => {
  const original = window.innerWidth;
  beforeEach(() => {
    window.innerWidth = original;
  });

  it("spells the actions out when there is room", () => {
    mount({ width: 1920 });
    expect(editButton().textContent).toBe("Edit layout");
    expect(screen.getByRole("button", { name: "Add a widget" }).textContent).toBe("Store");
  });

  it("drops the labels before it drops anything else", () => {
    mount({ width: 1000 });
    expect(editButton().textContent).toBe("");
    // Still reachable by name, which is the whole point of dropping the label
    // rather than the button.
    expect(screen.getByRole("button", { name: "Add a widget" })).toBeTruthy();
    expect(screen.getByText("Daybreak")).toBeTruthy();
  });

  it("gives up the time next, since a clock widget already shows it", () => {
    mount({ width: 800 });
    expect(screen.getByText("Daybreak")).toBeTruthy();
    expect(screen.queryByText(/^\d{1,2}:\d{2}/)).toBeNull();
  });

  it("keeps the search field at the narrowest width, having dropped the rest", () => {
    mount({ width: 500 });
    expect(screen.queryByText("Daybreak")).toBeNull();
    // role=combobox, not searchbox: the field carries the suggestion list.
    expect(screen.getByRole("combobox", { name: "Search the web" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Settings" })).toBeTruthy();
  });
});

describe("Header theme button", () => {
  it("goes round the ring rather than flipping between two", () => {
    const { update } = mount({ theme: "system" });
    fireEvent.click(themeButton());
    expect(update).toHaveBeenCalledWith("appearance", { theme: "light" });
  });

  it("can get back to following the system, which it could not before", () => {
    const { update } = mount({ theme: "dark" });
    fireEvent.click(themeButton());
    expect(update).toHaveBeenCalledWith("appearance", { theme: "system" });
  });

  it("says which state it is in, not which one it resolved to", () => {
    mount({ theme: "system" });
    expect(themeButton().getAttribute("aria-label")).toBe(
      "Theme: following your system. Switch to light"
    );
  });
});

describe("Header engine picker", () => {
  const open = () => {
    const button = screen.getByRole("button", { name: /^Search engine:/ });
    fireEvent.click(button);
    return button;
  };

  it("opens closed, and says so", () => {
    mount();
    const button = screen.getByRole("button", { name: /^Search engine:/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("puts focus on the engine in use", () => {
    mount();
    open();
    expect(document.activeElement.getAttribute("aria-checked")).toBe("true");
  });

  it("moves focus with the arrow keys, and wraps", () => {
    mount();
    open();
    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitemradio");
    const startedAt = items.indexOf(document.activeElement);
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(items.indexOf(document.activeElement)).toBe((startedAt + 1) % items.length);
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(items.indexOf(document.activeElement)).toBe(
      (startedAt - 1 + items.length) % items.length
    );
  });

  it("jumps to either end", () => {
    mount();
    open();
    const menu = screen.getByRole("menu");
    const items = within(menu).getAllByRole("menuitemradio");
    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement).toBe(items[items.length - 1]);
    fireEvent.keyDown(menu, { key: "Home" });
    expect(document.activeElement).toBe(items[0]);
  });

  it("closes on Escape and hands focus back", () => {
    mount();
    const button = open();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("opens on the down arrow, the way a collapsed menu should", () => {
    mount();
    const button = screen.getByRole("button", { name: /^Search engine:/ });
    button.focus();
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("picks an engine and closes", () => {
    const { update } = mount();
    open();
    const items = within(screen.getByRole("menu")).getAllByRole("menuitemradio");
    const other = items.find((i) => i.getAttribute("aria-checked") === "false");
    fireEvent.click(other);
    expect(update).toHaveBeenCalledWith("behavior", expect.objectContaining({ searchEngine: expect.any(String) }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
