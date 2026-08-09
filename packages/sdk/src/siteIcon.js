import { faviconUrl } from "./favicon";

// Chrome's favicon endpoint always answers. For a site it has never seen it
// hands back its own stand-in globe rather than an error, so an <img> that
// loaded is no evidence that a real icon exists — wiring it straight into the
// grid would fill a fresh profile with identical grey globes where a coloured
// monogram reads better.
//
// So the pixels are read back and compared against that stand-in, which is
// itself fetched once for an address that cannot have been visited. Nothing
// about the placeholder is hardcoded: whatever Chrome uses today, this
// recognises, and if a future Chrome answers with an error instead the load
// simply fails and the same fallback applies.

// One request size for everything, so a sample and the placeholder go through
// an identical pipeline and can be compared exactly.
export const FETCH_SIZE = 64;

// Both are reduced to this grid before comparing — small enough to be cheap
// and to shrug off a pixel of antialiasing, large enough that two different
// site icons never collapse onto the same signature.
export const SAMPLE = 16;

// Under this share of pixels carrying any ink at all, there is nothing to
// show: a transparent square, or the single faint dot some sites serve.
export const MIN_INK = 0.05;

// Two signatures this close are the same image. Not zero, because a redraw at
// a different moment can differ by an edge pixel or two.
export const SAME = 0.06;

// Alpha below this is not ink. Well under half, so an anti-aliased edge still
// counts, but a fully transparent pixel never does.
const INK_ALPHA = 24;

export function inkFraction(data) {
  let inked = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > INK_ALPHA) inked += 1;
  return inked / (data.length / 4);
}

// Each pixel to one character: two bits per channel, or "." where there is no
// ink. Coarse on purpose — the question is "is this the same picture", not
// "are these bytes equal".
export function signature(data) {
  let out = "";
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] <= INK_ALPHA) {
      out += ".";
      continue;
    }
    out += String.fromCharCode(48 + (data[i] >> 6) * 16 + (data[i + 1] >> 6) * 4 + (data[i + 2] >> 6));
  }
  return out;
}

// Share of positions that disagree. 0 is identical, 1 is nothing in common.
export function distance(a, b) {
  if (!a || !b || a.length !== b.length) return 1;
  let differ = 0;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) differ += 1;
  return differ / a.length;
}

// Worth showing: it loaded, it is not blank, and it is not the stand-in.
export function isUsable(sample, placeholder) {
  if (!sample) return false;
  if (sample.ink < MIN_INK) return false;
  if (placeholder && distance(sample.signature, placeholder) <= SAME) return false;
  return true;
}

function drawSample(img) {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, SAMPLE, SAMPLE);
  try {
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    // Same-origin in both places this runs — the extension's own
    // chrome-extension:// endpoint, and data: URIs, neither of which taints
    // the canvas. A future source that did would land here rather than throw.
    return ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;
  } catch {
    return null;
  }
}

function load(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function sampleOf(src) {
  const img = await load(src);
  if (!img) return null;
  const data = drawSample(img);
  if (!data) return null;
  return { signature: signature(data), ink: inkFraction(data) };
}

// An address no profile can have visited, so what comes back is by definition
// Chrome's stand-in. `.invalid` is reserved for exactly this (RFC 2606) and
// resolves nowhere, so nothing is ever requested over the network.
const UNVISITED = "https://icon-probe.daybreak.invalid/";

let placeholder = null;

export function placeholderSignature() {
  if (!placeholder) {
    const src = faviconUrl(UNVISITED, FETCH_SIZE);
    placeholder = src
      ? sampleOf(src).then((sample) => sample?.signature ?? null)
      : Promise.resolve(null);
  }
  return placeholder;
}

// One verdict per address per page load — a link's icon cannot change while
// the tab is open, and the grid asks for it on every render.
const verdicts = new Map();

export function siteIcon(pageUrl) {
  if (!pageUrl) return Promise.resolve(null);
  if (!verdicts.has(pageUrl)) verdicts.set(pageUrl, decide(pageUrl));
  return verdicts.get(pageUrl);
}

async function decide(pageUrl) {
  const src = faviconUrl(pageUrl, FETCH_SIZE);
  // Outside the packaged extension there is no endpoint to ask.
  if (!src) return null;
  const [sample, stand] = await Promise.all([sampleOf(src), placeholderSignature()]);
  return isUsable(sample, stand) ? src : null;
}

// Testing seam: the verdict cache would otherwise outlive a test's stubs.
export function resetSiteIcons() {
  verdicts.clear();
  placeholder = null;
}
