import { describe, expect, it, vi } from "vitest";
import { appVersion, versionLabel } from "./version";
import { readFileSync } from "node:fs";
import { installChromeMock } from "../test/setup";

describe("the two places the version is written", () => {
  // They had drifted by the time this was added: package.json said 2.3.0 and
  // public/manifest.json still said 2.2.0. That is not a cosmetic mismatch —
  // the manifest's version is what Chrome installs and what the store checks
  // for being higher than the live one, while appVersion() reads the
  // extension manifest at runtime and __APP_VERSION__ comes from package.json.
  // Ship them disagreeing and the About row shows one number while the browser
  // believes another.
  const pkg = JSON.parse(readFileSync("package.json", "utf8")).version;
  const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8")).version;

  it("agree", () => {
    expect(manifest, `public/manifest.json ${manifest} vs package.json ${pkg}`).toBe(pkg);
  });

  it("are a plain three-part version, which is what the store accepts", () => {
    expect(pkg).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

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
