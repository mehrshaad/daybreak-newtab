import { describe, expect, it, vi } from "vitest";
import { appVersion, versionLabel } from "./version";
import { installChromeMock } from "../test/setup";

describe("appVersion", () => {
  it("prefers the running extension's own manifest", () => {
    installChromeMock();
    globalThis.chrome.runtime.getManifest = vi.fn(() => ({ version: "9.9.9" }));
    expect(appVersion()).toBe("9.9.9");
  });

  it("falls back to the stamped version off the dev server", () => {
    // No chrome at all here — setup.js deletes it between tests.
    expect(typeof appVersion()).toBe("string");
  });
});

describe("versionLabel", () => {
  it("is empty when there is no version to report", () => {
    installChromeMock();
    globalThis.chrome.runtime.getManifest = vi.fn(() => ({}));
    expect(versionLabel()).toBe("");
  });

  it("reports the version, and the build date when there is one", () => {
    installChromeMock();
    globalThis.chrome.runtime.getManifest = vi.fn(() => ({ version: "2.1.0" }));
    const label = versionLabel("en-GB");
    expect(label.startsWith("2.1.0")).toBe(true);
  });
});
