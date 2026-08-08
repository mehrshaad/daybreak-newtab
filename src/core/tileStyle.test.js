import { describe, expect, it } from "vitest";
import { cameraFor, cameraStyle, tileStyle } from "./tileStyle";

const viewport = { innerWidth: 1600, innerHeight: 900 };
const boardRect = { left: 20, top: 100 };
const tileRect = { left: 120, top: 200, width: 400, height: 200 };

describe("tileStyle grid placement", () => {
  it("spans the requested columns and rows", () => {
    const s = tileStyle({ size: [5, 3] });
    expect(s.gridColumn).toBe("span 5");
    expect(s.gridRow).toBe("span 3");
  });

  // On a narrow window the grid drops to 8 or 4 columns; a 5-wide tile must
  // shrink to fit rather than overflow the page.
  it("clamps the span to the available columns", () => {
    expect(tileStyle({ size: [5, 2], columns: 4 }).gridColumn).toBe("span 4");
    expect(tileStyle({ size: [5, 2], columns: 8 }).gridColumn).toBe("span 5");
    expect(tileStyle({ size: [3, 2], columns: 4 }).gridColumn).toBe("span 3");
  });

  it("never clamps the row span", () => {
    expect(tileStyle({ size: [5, 3], columns: 4 }).gridRow).toBe("span 3");
  });

  it("applies the radius setting", () => {
    expect(tileStyle({ radius: 4 }).borderRadius).toBe("4px");
    expect(tileStyle({ radius: 32 }).borderRadius).toBe("32px");
  });
});

const alphaOf = (css) => Number(/rgba\([\d, ]+,([\d.]+)\)/.exec(css)[1]);

describe("tileStyle opacity", () => {
  // The slider is absolute: 100% is opaque, 0% is invisible, in both themes.
  it("maps the slider straight onto the fill alpha", () => {
    for (const theme of ["dark", "light"]) {
      expect(alphaOf(tileStyle({ theme, alpha: 100 }).background), theme).toBe(1);
      expect(alphaOf(tileStyle({ theme, alpha: 0 }).background), theme).toBe(0);
      expect(alphaOf(tileStyle({ theme, alpha: 50 }).background), theme).toBe(0.5);
    }
  });

  it("uses a dark surface in dark mode, so a solid tile is not a white card", () => {
    expect(tileStyle({ theme: "dark", alpha: 100 }).background).toBe("rgba(28,30,38,1)");
    expect(tileStyle({ theme: "light", alpha: 100 }).background).toBe("rgba(255,255,255,1)");
  });
});

describe("tileStyle blur", () => {
  it("applies a backdrop filter only when blur is on", () => {
    expect(tileStyle({ blur: true }).backdropFilter).toBe("var(--blur-tile)");
    expect(tileStyle({ blur: false }).backdropFilter).toBe("none");
  });

  // The fill is the user's own opacity setting either way; only the frost goes.
  it("leaves the fill alone when blur is switched off", () => {
    for (const theme of ["dark", "light"]) {
      expect(tileStyle({ theme, alpha: 40, blur: false }).background, theme).toBe(
        tileStyle({ theme, alpha: 40, blur: true }).background
      );
    }
  });
});

describe("tileStyle states", () => {
  it("edit mode shows an accent ring but does not change the cursor", () => {
    const s = tileStyle({ editing: true });
    expect(s.boxShadow).toContain("--accentLine");
  });

  // With zoom off a tile does nothing when clicked, so it must not look
  // clickable. Dragging starts from the handle, not the tile body, so being
  // in edit mode does not change the cursor either.
  it("only offers a pointer cursor when a click would do something", () => {
    expect(tileStyle({ zoomMode: "Camera" }).cursor).toBe("pointer");
    expect(tileStyle({ zoomMode: "None" }).cursor).toBe("default");
    expect(tileStyle({ zoomMode: "None", editing: true }).cursor).toBe("default");
  });

  it("the menu target outranks the edit ring", () => {
    const s = tileStyle({ editing: true, menuTarget: true });
    expect(s.boxShadow).toBe("0 0 0 1.5px var(--accent) inset");
  });

  it("is inert with no zoom applied", () => {
    const s = tileStyle({});
    // Relative only so edit-mode chrome can be positioned over the tile; it
    // still takes part in the grid and is not lifted or dimmed.
    expect(s.position).toBe("relative");
    expect(s.opacity).toBeUndefined();
    expect(s.pointerEvents).toBeUndefined();
  });
});

describe("tileStyle zoom modes", () => {
  it("unfocused tiles stop taking clicks in every mode", () => {
    for (const zoomMode of ["Camera", "Expand", "Spotlight"]) {
      expect(tileStyle({ zoomed: true, focused: false, zoomMode }).pointerEvents).toBe(
        "none"
      );
    }
  });

  // Camera moves in on the board itself, so neighbours must stay solid and
  // merely be cropped; Expand and Spotlight are overlays, so the board recedes.
  it("keeps neighbours solid under Camera and dims them for the overlays", () => {
    expect(tileStyle({ zoomed: true, focused: false, zoomMode: "Camera" }).opacity).toBe(1);
    expect(tileStyle({ zoomed: true, focused: false, zoomMode: "Expand" }).opacity).toBe(0.2);
    expect(tileStyle({ zoomed: true, focused: false, zoomMode: "Spotlight" }).opacity).toBe(
      0.2
    );
  });

  it("Camera keeps the tile in flow so the board can transform around it", () => {
    const s = tileStyle({ zoomed: true, focused: true, zoomMode: "Camera" });
    expect(s.position).toBe("relative");
    expect(s.cursor).toBe("default");
  });

  // A page zoom magnifies the tile exactly as it sits on the board. Restyling
  // it — a lifted background, a big drop shadow — made it read as a modal being
  // pulled toward the screen instead.
  it("Camera does not restyle the focused tile", () => {
    const plain = tileStyle({ theme: "dark", alpha: 100 });
    const zoomedIn = tileStyle({
      theme: "dark",
      alpha: 100,
      zoomed: true,
      focused: true,
      zoomMode: "Camera",
    });
    expect(zoomedIn.background).toBe(plain.background);
    expect(zoomedIn.boxShadow).toBe(plain.boxShadow);
    expect(zoomedIn.borderRadius).toBe(plain.borderRadius);
    expect(zoomedIn.padding).toBe(plain.padding);
  });

  it("Expand pins to the viewport and reserves room for the drawer", () => {
    const closed = tileStyle({ zoomed: true, focused: true, zoomMode: "Expand" });
    expect(closed.position).toBe("fixed");
    expect(closed.right).toBe("3vw");

    const open = tileStyle({
      zoomed: true,
      focused: true,
      zoomMode: "Expand",
      panelOpen: true,
    });
    expect(open.right).toBe("calc(340px + 3vw)");
  });

  it("Spotlight centres a fixed-size panel", () => {
    const s = tileStyle({ zoomed: true, focused: true, zoomMode: "Spotlight" });
    expect(s.position).toBe("fixed");
    expect(s.transform).toBe("translate(-50%,-50%)");
    expect(s.width).toBe("min(760px, 72vw)");
  });

  it("focused tiles never keep the grab cursor", () => {
    for (const zoomMode of ["Camera", "Expand", "Spotlight"]) {
      const s = tileStyle({ zoomed: true, focused: true, editing: true, zoomMode });
      expect(s.cursor).toBe("default");
    }
  });
});

describe("cameraFor", () => {
  it("centres the tile horizontally", () => {
    const cam = cameraFor(tileRect, boardRect, viewport);
    const tileCentreX = tileRect.left + tileRect.width / 2;
    expect(tileCentreX + cam.tx).toBe(viewport.innerWidth / 2);
  });

  it("centres the tile in the space below the header", () => {
    const header = 78;
    const cam = cameraFor(tileRect, boardRect, viewport, header);
    const tileCentreY = tileRect.top + tileRect.height / 2;
    expect(tileCentreY + cam.ty).toBe((header + viewport.innerHeight) / 2);
  });

  it("sets the transform origin relative to the board, not the viewport", () => {
    const cam = cameraFor(tileRect, boardRect, viewport);
    expect(cam.ox).toBe(tileRect.left + tileRect.width / 2 - boardRect.left);
    expect(cam.oy).toBe(tileRect.top + tileRect.height / 2 - boardRect.top);
  });

  it("never scales past 3.2x, however small the tile", () => {
    const tiny = { left: 0, top: 0, width: 10, height: 10 };
    expect(cameraFor(tiny, boardRect, viewport).s).toBe(3.2);
  });

  it("scales down rather than overflowing a large tile", () => {
    const huge = { left: 0, top: 0, width: 1400, height: 800 };
    const cam = cameraFor(huge, boardRect, viewport);
    expect(cam.s).toBeLessThan(1);
    expect(huge.height * cam.s).toBeLessThanOrEqual(viewport.innerHeight - 78 - 56 + 0.001);
  });

  it("pushes in far enough to feel decisive on a normal tile", () => {
    // A 4x2 tile on a 1600px board should end up filling most of the width.
    const cam = cameraFor(tileRect, boardRect, viewport);
    expect(tileRect.width * cam.s).toBeGreaterThan(viewport.innerWidth * 0.6);
  });
});

describe("cameraStyle", () => {
  const cam = cameraFor(tileRect, boardRect, viewport);

  it("emits a rounded translate and 3dp scale when active", () => {
    const t = cameraStyle(cam, true).transform;
    expect(t).toMatch(/^translate\(-?\d+px, -?\d+px\) scale\(\d+\.\d{3}\)$/);
  });

  // transform and will-change both make an element a containing block for
  // fixed-position descendants. Leaving either on while idle would pin
  // Expand/Spotlight tiles to the board instead of the viewport.
  it("declares neither transform nor will-change while idle", () => {
    for (const idle of [cameraStyle(cam, false), cameraStyle(null, true)]) {
      expect(idle.transform).toBeUndefined();
      expect(idle.willChange).toBeUndefined();
      expect(idle.position).toBeUndefined();
      expect(idle.zIndex).toBeUndefined();
    }
  });

  // The active transform creates a stacking context that traps the focused
  // tile's z-index, so the wrapper itself must clear the scrim (z-index 30).
  it("lifts above the scrim while zooming", () => {
    const active = cameraStyle(cam, true);
    expect(active.position).toBe("relative");
    expect(active.zIndex).toBeGreaterThan(30);
  });

  it("keeps a transition in both states so zoom out animates", () => {
    expect(cameraStyle(cam, true).transition).toContain("transform");
    expect(cameraStyle(cam, false).transition).toContain("transform");
  });
});
