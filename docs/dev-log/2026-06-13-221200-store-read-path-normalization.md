# 2026-06-13 22:12:00 - Cycle 14: Store Read-Path Normalization (Fixing a Glass Invariant)

This cycle is a course-correction, prompted by a sharp question: the "inconsistency I parked" at the
end of Cycle 10 is not minor — it's a **lying boundary**, and our green suite couldn't see it.
Fixing it matters more than adding the next feature.

## What was actually wrong

Cycle 10 added `slug: string` to the `WorkItem` type — a **domain invariant**. But the filesystem
store read rows like this:

```ts
return JSON.parse(await readFile(this.filePath, "utf8")) as WorkItem[];
```

That `as` is a **cast, not a conversion**. It tells the compiler "trust me, these are WorkItems"
without checking. Our `data/work-items.json` rows have no `slug`, so at runtime `list()` returned
objects with `slug === undefined` while the type swore it was a `string`. The boundary lied.

### Why the test suite was blind to it

Every existing test built items through the front door — `createWorkItem` — which always fills the
slug. **Nothing loaded reality-shaped data through the back door (the file).** So the invariant
looked solid in tests and would shatter the moment real persisted data flowed through. That is the
textbook **glass invariant** the playbook (§3) warns about: correct in memory, broken at the real
I/O boundary.

### Cycle 9's round-trip gave false confidence

The Cycle 9b test saved a *complete* `WorkItem` and read it back. By construction that can't reveal a
missing-field gap — the thing it saved already had every field. Testing owned infrastructure "for
real" means feeding it data shaped like **reality** (hand-authored, partial), not data we just
minted with the very factory that guarantees completeness.

Legacy already knew this: its "silent fixups" run **on every read** (`DOMAIN_PRIMER §2`). We built
the writer in Cycle 9 and skipped the reader's normalization.

## The fix, and why it belongs in the store

The port's contract is `list(): Promise<WorkItem[]>` — it is *required* to return valid domain
objects. The adapter was violating its own contract. So `list()` must reconstitute each loaded row
through the domain factory instead of casting.

This is **not** business logic leaking into an adapter. The rules (slug derivation, defaults) stay
entirely inside `createWorkItem` (domain, fully tested). The store merely *calls* the domain to honor
its contract — an adapter that returns invalid domain objects is the real violation. It's a
**tolerant reader / strict writer**: we write canonical `WorkItem`s, we read possibly-partial rows
and normalize them.

## Cycle 14

### RED

Behavior:

```text
A loaded snapshot row with no slug yields a work item whose slug is derived from its title.
```

The test writes a raw row **by hand** (not via `createWorkItem`) — the exact shape of the real data
file — so it exercises the back door:

```ts
await writeFile(path, JSON.stringify([
  { id: "loaded-001", title: "Loaded Item", productLineId: "catch-all", visibility: "public" },
]), "utf8");

const [item] = await new FilesystemWorkItemStore(path).list();
expect(item.slug).toBe("loaded-item");
```

```text
- Expected: "loaded-item"
+ Received: undefined
 Tests  1 failed | 2 passed (3)
```

Good RED — and notice *this is the bug itself*, now visible to the suite. That's the real win:
the hole in our testing is closed, not just the field.

### GREEN

```ts
const rows = JSON.parse(await readFile(this.filePath, "utf8")) as CreateWorkItemInput[];
return rows.map(createWorkItem);
```

Two honest changes:

- `rows.map(createWorkItem)` reconstitutes each row → every returned item satisfies the invariant
  (slug derived when absent, **preserved when present** thanks to Cycle 13).
- The cast changed from `as WorkItem[]` (a lie) to `as CreateWorkItemInput[]` (the truth: this is
  raw input that still needs normalizing).

```text
 Tests  15 passed (15)
```

The **round-trip test (9b) still passes** — important. It saves a complete item and reads it back
through the new normalization. That only stays green because `createWorkItem` is **idempotent** on an
already-complete item: explicit slug preserved, defaults already filled, so `toEqual` holds. (If it
*hadn't* been idempotent, this would have caught it.)

### Regression check at the real boundary

Re-ran `npx astro build` (the read path changed, so the framework edge must be re-proven):

```text
  ├─ /project/shipped-build/index.html
  1 page(s) built
dist/project/draft-build -> NO PAGE (correct)
```

The real `data/work-items.json` rows now flow through `createWorkItem` on read with no error, the
public page still builds, and the private item still produces nothing. No regression.

### REFACTOR

None.

## Honest status of the boundary (it is better, not bulletproof)

I fixed the specific lie (missing slug). While here I noticed the read boundary has **other**
untrusted-input gaps that are *not* fixed and deserve their own trust-boundary cycles (rejection
tests, which the playbook says come first):

- A row missing `id` → `item.id` is `undefined` (would yield a broken route). Not yet handled.
- Non-array JSON (e.g. `{}`) → `.map` throws; malformed JSON → `JSON.parse` throws. Both currently
  propagate as raw errors rather than a clear, intentional failure.

These are real and worth doing — but each is a separate behavior, and inventing their handling now
(without a failing test) would repeat the very "write untested branches" mistake. They're logged as
the next candidates.

## State after this cycle

- Tests: **15 passing (8 files)**. Suite green. Real build re-proven.
- The `slug: string` invariant is now **enforced at the read boundary**, and a test feeds real-shaped
  data to keep it honest. `data/work-items.json` can stay slug-free (authors don't hand-write slugs);
  the store fills them.

## Next candidate behaviors

- [ ] (trust boundary) reject / clearly handle a loaded row missing `id`
- [ ] (trust boundary) handle malformed snapshot JSON deliberately (not a raw throw)
- [ ] log-entry slug from `day-{day}-{title}`; untitled entry → "untitled entry"; log-slug dedupe
- [ ] then route `/project/<slug>` (now unblocked — loaded items have slugs)
