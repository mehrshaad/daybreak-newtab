import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Widget from "./Widget";

// A bookmark's own settings, and the split that makes them different from a
// Quick Link's.
//
// A Quick Link is entirely ours: name, address and colour all live in the
// widget's config. A bookmark is Chrome's. So the name and the address are
// written back to Chrome — a rename here is a rename in the bookmark manager,
// which is the whole point of the widget — while the colour, which Chrome's
// model has no room for, is kept in our config keyed by the bookmark's id.
//
// Keyed by id and not by title or URL on purpose: it has to survive the
// bookmark being renamed or moved, which are exactly the things this editor
// does.

const TREE = [
  {
    children: [
      {
        id: "1",
        title: "Bookmarks bar",
        children: [
          { id: "10", title: "Dev", children: [{ id: "100", title: "GitHub", url: "https://github.com/" }] },
        ],
      },
    ],
  },
];

function installChrome() {
  const update = vi.fn((id, changes, cb) => cb?.({ id, ...changes }));
  const remove = vi.fn((id, cb) => cb?.());
  globalThis.chrome = {
    runtime: { lastError: null },
    permissions: { contains: (_p, cb) => cb(true), request: (_p, cb) => cb(true) },
    bookmarks: {
      getTree: (cb) => cb(TREE),
      update,
      remove,
      onCreated: { addListener() {}, removeListener() {} },
      onRemoved: { addListener() {}, removeListener() {} },
      onChanged: { addListener() {}, removeListener() {} },
      onMoved: { addListener() {}, removeListener() {} },
    },
  };
  return { update, remove };
}

afterEach(() => {
  delete globalThis.chrome;
});

const mount = (config = {}, setConfig = vi.fn()) =>
  render(
    <Widget
      size={[4, 3]}
      options={{ layout: "grid", iconScale: "m", perFolder: 6, showHeadings: true, newTab: false }}
      config={config}
      setConfig={setConfig}
      setOptions={vi.fn()}
      toast={vi.fn()}
    />
  );

describe("a bookmark's editor", () => {
  it("writes a rename back to Chrome, not to our own config", async () => {
    const { update } = installChrome();
    const setConfig = vi.fn();
    mount({}, setConfig);
    const icon = await screen.findByRole("button", { name: "GitHub" });
    fireEvent.contextMenu(icon);
    const name = await screen.findByLabelText("Bookmark name");
    fireEvent.change(name, { target: { value: "Source" } });
    fireEvent.blur(name);
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0]).toBe("100");
    expect(update.mock.calls[0][1]).toMatchObject({ title: "Source" });
    // The rename is Chrome's business. Nothing about it belongs in our config.
    for (const call of setConfig.mock.calls) {
      expect(JSON.stringify(call[0])).not.toContain("Source");
    }
  });

  it("keeps a colour in our config, keyed by the bookmark's id", async () => {
    installChrome();
    const setConfig = vi.fn();
    mount({}, setConfig);
    fireEvent.contextMenu(await screen.findByRole("button", { name: "GitHub" }));
    // Any swatch will do; the question is where the value lands.
    const swatches = await screen.findAllByRole("button", { name: /colour|color/i });
    fireEvent.click(swatches[1] || swatches[0]);
    await waitFor(() => expect(setConfig).toHaveBeenCalled());
    const written = setConfig.mock.calls.at(-1)[0];
    expect(Object.keys(written.styles)).toEqual(["100"]);
  });

  it("paints a stored colour onto the icon", async () => {
    installChrome();
    mount({ styles: { 100: { color: "#ff8f8f", ink: "dark" } } });
    // The grid has to actually read config.styles, or the editor writes
    // somewhere nothing looks at.
    const icon = await screen.findByRole("button", { name: "GitHub" });
    expect(icon.innerHTML).toContain("ff8f8f");
  });

  it("asks twice before deleting, because this leaves the browser", async () => {
    const { remove } = installChrome();
    mount({});
    fireEvent.contextMenu(await screen.findByRole("button", { name: "GitHub" }));
    const button = await screen.findByRole("button", { name: /Delete bookmark/i });
    fireEvent.click(button);
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: /Delete from Chrome/i }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith("100", expect.any(Function)));
  });
});
