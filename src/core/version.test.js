import { describe, expect, it, vi } from "vitest";
import { appVersion, versionLabel } from "./version";
import { readFileSync } from "node:fs";
import { installChromeMock } from "../test/setup";
import { bugUrl, feedbackBody } from "./contact";

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
  const pkg = JSON.parse(readFileSync("package.json", "utf8")).version;

  it("prefers the running extension's own manifest", () => {
    installChromeMock();
    globalThis.chrome.runtime.getManifest = vi.fn(() => ({ version: "9.9.9" }));
    expect(appVersion()).toBe("9.9.9");
  });

  it("answers a real version off the dev server, not an empty string", () => {
    // No chrome at all here — setup.js deletes it between tests.
    //
    // `typeof === "string"` was the old assertion and it passed for "", which
    // is exactly what the failure looked like: the version came from a
    // build-time `define`, so anything that did not apply the substitution
    // left the identifier bare, typeof answered "undefined", and this returned
    // nothing. The About row showed a dash, and every bug report composed from
    // that state carried no version — the one fact it exists to carry.
    //
    // This test cannot reproduce that condition and does not pretend to:
    // vitest loads the same vite config, so the define always applies here and
    // both the old and the new implementation pass. What it catches is the
    // empty string, whatever the cause. The define failure is fixed by not
    // depending on a substitution at all — see version.js.
    expect(appVersion()).toBe(pkg);
    expect(appVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("puts that version into a bug report and a feedback mail", () => {
    // The paths that actually need it. A report filed with no version is a
    // report nobody can act on.
    expect(bugUrl()).toContain(encodeURIComponent(pkg));
    expect(feedbackBody("hello")).toContain(pkg);
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
