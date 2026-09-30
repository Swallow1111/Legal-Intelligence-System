import assert from "node:assert/strict";
import test from "node:test";
import { legalAuthorityBoost, type AuthorityReport } from "@aihot/backend/events/hot";

const NOW = new Date("2026-09-29T12:00:00Z");

function report(overrides: Partial<AuthorityReport> = {}): AuthorityReport {
  return {
    first_party: true,
    selected: true,
    score: 80,
    tier: "T1",
    category: "judicial-rules",
    at: NOW,
    ...overrides,
  };
}

test("selected first-party T1 legal rules receive a bounded authority contribution", () => {
  assert.equal(legalAuthorityBoost([report()], NOW), 0.8);
  assert.equal(legalAuthorityBoost([report({ score: 120 })], NOW), 1);
});

test("authority contribution decays with the same 24-hour half-life as discussion heat", () => {
  const oneDayAgo = new Date(NOW.getTime() - 24 * 3600_000);
  assert.equal(legalAuthorityBoost([report({ at: oneDayAgo })], NOW), 0.4);
});

test("routine official news and weaker provenance do not bypass the two-source rule", () => {
  assert.equal(legalAuthorityBoost([report({ category: "major-cases" })], NOW), 0);
  assert.equal(legalAuthorityBoost([report({ tier: "T2" })], NOW), 0);
  assert.equal(legalAuthorityBoost([report({ first_party: false })], NOW), 0);
  assert.equal(legalAuthorityBoost([report({ selected: false })], NOW), 0);
});

test("authority contribution expires outside the 48-hour hot window", () => {
  const old = new Date(NOW.getTime() - 49 * 3600_000);
  assert.equal(legalAuthorityBoost([report({ at: old })], NOW), 0);
});
