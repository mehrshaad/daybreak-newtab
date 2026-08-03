import { describe, expect, it } from "vitest";
import { BACKUP_KIND, backupFilename, parseBackup } from "./backup";

describe("backupFilename", () => {
  it("is dated and json", () => {
    expect(backupFilename(new Date("2026-08-02T21:00:00Z"))).toBe(
      "daybreak-backup-2026-08-02.json"
    );
  });
});

describe("parseBackup", () => {
  const good = JSON.stringify({
    kind: BACKUP_KIND,
    version: 2,
    settings: { v: 2, board: { ids: ["clock"] } },
    buckets: { "scratchpad:text": "hi" },
  });

  it("accepts a well-formed backup", () => {
    const { data, error } = parseBackup(good);
    expect(error).toBeUndefined();
    expect(data.settings.board.ids).toEqual(["clock"]);
    expect(data.buckets["scratchpad:text"]).toBe("hi");
  });

  it("rejects non-JSON", () => {
    expect(parseBackup("not json").error).toMatch(/valid JSON/);
  });

  it("rejects JSON that isn't a backup", () => {
    expect(parseBackup('{"hello":"world"}').error).toMatch(/isn't a Daybreak backup/);
    expect(parseBackup("null").error).toBeTruthy();
    expect(parseBackup("[1,2,3]").error).toBeTruthy();
  });

  // A backup whose settings are missing would otherwise wipe the board.
  it("rejects a backup with no settings", () => {
    const bad = JSON.stringify({ kind: BACKUP_KIND, version: 2, buckets: {} });
    expect(parseBackup(bad).error).toMatch(/no settings/);
  });

  it("tolerates a backup with no buckets", () => {
    const noBuckets = JSON.stringify({
      kind: BACKUP_KIND,
      version: 2,
      settings: { v: 2 },
    });
    expect(parseBackup(noBuckets).error).toBeUndefined();
  });
});
