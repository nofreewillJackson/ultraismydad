# 2026-06-13 22:21:00 - Cycle 16: Reject a Non-Array Snapshot (Store Trust Boundary)

Second trust-boundary cycle. Cycle 15 hardened the *domain* (no id → reject). This one hardens the
*store*: a snapshot file whose top-level JSON isn't an array is malformed source, and the store
should say so plainly instead of crashing three layers down.

## Why this lives in the store, not the domain

This is about the **persisted file format** — a serialization/adapter concern. The domain knows
nothing about JSON or arrays; asking `createWorkItem` to validate the container shape would drag
infrastructure knowledge into pure rules. The store owns the parse step (bytes → structured data),
so it owns "the structure must be a list of rows." Clean separation: the store validates the
*shape of the file*, the domain validates the *content of a row* (Cycle 15).

## Cycle 16

### RED

Behavior:

```text
list() rejects a snapshot whose top-level JSON is not an array, with a clear error.
```

```ts
await writeFile(path, JSON.stringify({ not: "an array" }), "utf8");
await expect(new FilesystemWorkItemStore(path).list()).rejects.toThrow(/array/i);
```

`/array/i` is the point: it doesn't just assert *that* it fails, it asserts the failure is *about
the array shape*. A vague `.rejects.toThrow()` would have passed against today's accidental crash —
which is exactly why it would be a worthless test.

```text
× rejects a snapshot whose top-level JSON is not an array
  → expected [Function] to throw error matching /array/i but got 'rows.map is not a function'
 Tests  1 failed | 3 passed (4)
```

Perfect RED: it already throws, but the error is the leaky implementation detail `rows.map is not a
function`. Loud, but useless to whoever has to fix the snapshot.

### GREEN (minimal)

```ts
const parsed = JSON.parse(await readFile(this.filePath, "utf8"));
if (!Array.isArray(parsed)) {
  throw new Error(`snapshot at ${this.filePath} must be a JSON array`);
}
return (parsed as CreateWorkItemInput[]).map(createWorkItem);
```

A named guard, and the message includes the **path** — at build time that tells you *which* file to
go fix.

```text
 Tests  17 passed (17)
```

### REFACTOR (this one did real work — not every refactor is "none")

The minimal GREEN left the `try` wrapping the parse + validate + normalize, with a catch that only
cares about `ENOENT`. But `ENOENT` is purely a **read** concern — "the file isn't there → no items
yet." Letting it span the parsing made the catch look responsible for more than it is, and a stray
filesystem error code surfacing during normalization could be misread. I scoped the `try` to only
the `readFile`:

```ts
let raw: string;
try {
  raw = await readFile(this.filePath, "utf8");   // ENOENT belongs to the read alone
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
  throw error;
}
const parsed = JSON.parse(raw);
if (!Array.isArray(parsed)) throw new Error(`snapshot at ${this.filePath} must be a JSON array`);
return (parsed as CreateWorkItemInput[]).map(createWorkItem);
```

No behavior change (malformed JSON still propagates as a `SyntaxError`, as before — verified: it was
caught-and-rethrown before, now it propagates directly; same observable result), but each line now
owns exactly one concern. Re-ran: **17 passing**, and `npx astro build` still produces the public
page and no private page.

## State after this cycle

- Tests: **17 passing (8 files)**. Suite green. Build re-proven.
- The read boundary now: missing file → empty; wrong container shape → clear error; valid rows →
  normalized through the domain (with the domain rejecting an id-less row). Honest *and* much harder
  to feed garbage silently.

## Next candidate behaviors

- [ ] (optional) wrap malformed-JSON `SyntaxError` with the snapshot path for an equally clear
      build failure. Today it propagates as a stock `SyntaxError` — loud and reasonably clear, so
      this is a nicety, not a hole. Do it only if a real need shows up.
- [ ] Section A log entries (`day-{day}-{title}` slug, "untitled entry", log-slug dedupe), **or**
      `/project/<slug>` routing (unblocked since Cycle 14).
