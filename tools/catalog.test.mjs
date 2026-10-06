import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  PAGE_SIZE,
  readState,
  referenceCitation,
  referenceURL,
  selectReferences,
  summarizeReferences,
  venueLabel,
} from "../site/catalog.js";

const reference = (changes = {}) => ({
  id: "example",
  title: "Learning from Physical Interaction",
  authors: ["René Researcher"],
  year: 2025,
  venue: "Conference on Robot Learning",
  type: "conference",
  url: "",
  doi: "",
  ...changes,
});

test("URL state accepts shared filters and only supported page sizes", () => {
  const state = readState(
    "?q=robot&year=earlier&type=conference&venue=CoRL&size=48&page=3&sort=oldest",
  );
  assert.deepEqual(state, {
    query: "robot",
    year: "earlier",
    type: "conference",
    venue: "CoRL",
    size: 48,
    page: 3,
    sort: "oldest",
  });
  const invalid = readState(
    "?year=bad&type=__proto__&size=100000&page=-4&sort=random",
  );
  assert.equal(invalid.year, "all");
  assert.equal(invalid.type, "all");
  assert.equal(invalid.sort, "newest");
  assert.equal(invalid.size, PAGE_SIZE);
  assert.equal(invalid.page, 1);
  for (const size of [12, 24, 48])
    assert.equal(readState(`?size=${size}`).size, size);
  assert.equal(readState(`?q=${"a".repeat(400)}`).query.length, 300);
});

test("earlier years, type, normalized venues, and accent-insensitive queries combine", () => {
  const records = [
    reference({ id: "early", year: 2014 }),
    reference({ id: "modern", year: 2015 }),
    reference({
      id: "workshop",
      year: 2014,
      venue: "Conference on Robot Learning Workshop",
    }),
    reference({ id: "undated", year: null }),
  ];
  const state = readState(
    "?year=earlier&type=conference&venue=CoRL&q=rene+physical+corl",
  );
  assert.deepEqual(
    selectReferences(records, state).map((item) => item.id),
    ["early"],
  );
  assert.deepEqual(
    selectReferences(records, readState("?year=undated")).map(
      (item) => item.id,
    ),
    ["undated"],
  );
  assert.deepEqual(
    records.map((item) => item.id),
    ["early", "modern", "workshop", "undated"],
  );
});

test("venue normalization preserves workshop and unfamiliar venue identities", () => {
  assert.equal(venueLabel(reference()), "CoRL");
  assert.equal(
    venueLabel(reference({ venue: "CoRL Workshop" })),
    "CoRL Workshop",
  );
  const venue =
    "Proceedings of an Unfamiliar International Conference on Embodied Computing";
  assert.equal(venueLabel(reference({ venue })), venue);
});

test("collection totals include earlier, recent, future, and undated records", () => {
  const records = [
    reference({ year: 1966 }),
    reference({ year: 2014 }),
    reference({ year: 2015 }),
    reference({ year: 2027 }),
    reference({ year: null, type: "journal", venue: "Nature" }),
  ];
  const summary = summarizeReferences(records);
  assert.equal(summary.years.find((item) => item.value === "earlier").count, 2);
  assert.equal(summary.years.find((item) => item.value === "2026").count, 0);
  assert.equal(summary.years.find((item) => item.value === "2027").count, 1);
  assert.equal(summary.years.find((item) => item.value === "undated").count, 1);
  for (const values of Object.values(summary))
    assert.equal(
      values.reduce((sum, item) => sum + item.count, 0),
      records.length,
    );
  assert.deepEqual(summary.venues[0], {
    value: "CoRL",
    label: "CoRL",
    count: 4,
  });
});

test("publication links use existing HTTPS URLs without credentials", () => {
  const url = "https://arxiv.org/abs/2401.12963";
  assert.equal(referenceURL(reference({ url })), url);
  for (const unsafe of [
    "",
    "not-a-url",
    "http://example.com",
    "javascript:alert(1)",
    "https://user:secret@example.com",
  ])
    assert.equal(referenceURL(reference({ url: unsafe })), "");
  assert.equal(referenceURL(reference({ doi: "10.1000/example" })), "");
});

test("abbreviated authors do not produce doubled sentence punctuation", () => {
  const citation = referenceCitation(
    reference({ authors: ["A. Author", "et al."] }),
  );
  assert.match(citation, /^A\. Author, et al\. \(2025\)\./);
  assert.ok(!citation.includes("et al.."));
});

test("every displayed collection bucket matches its filter result", async () => {
  const records = JSON.parse(
    await readFile(new URL("../data/references.json", import.meta.url), "utf8"),
  );
  const summary = summarizeReferences(records);
  for (const [group, filter] of [
    ["years", "year"],
    ["types", "type"],
    ["venues", "venue"],
  ]) {
    assert.equal(
      summary[group].reduce((total, bucket) => total + bucket.count, 0),
      records.length,
    );
    for (const bucket of summary[group]) {
      const state = { ...readState(""), [filter]: bucket.value };
      assert.equal(
        selectReferences(records, state).length,
        bucket.count,
        `${filter}: ${bucket.label}`,
      );
    }
  }
});
