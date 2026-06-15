# 2026-06-14 21:45:00 - Cycle 32: A Log Entry Is Private By Default (prime-directive breadth)

Turning to the **prime directive**: private data must never reach public output; everything is
private by default. Work items have had this since Cycle 1. This cycle extends "private by default"
to the log entry, and introduces the **single shared visibility vocabulary** that lets the rule stay
uniform across every entity.

## The cleanroom decision being enforced (a divergence from legacy)

Legacy is inconsistent (`DOMAIN_PRIMER §4`): work items publish on explicit `"public"`; log entries
are shown on the looser `!== "private"` in the live path but only `"public"` bakes into the build;
product lines/series **default to public**. The primer itself flags: *"rebuild decision needed: pick
one rule … the safer, intended rule is explicit public to publish."*

AGENTS §4 already made that decision — **one uniform rule: default-deny.** So in the rebuild a log
entry with no visibility set is **private**, not shown. This is deliberately stricter than legacy's
permissive log rule, and it's the only choice consistent with "when in doubt, default to hidden."

## Cycle 32

### RED

```ts
const logEntry = createLogEntry({ id: "log-005", title: "Draft note" });
expect(logEntry.visibility).toBe("private");
```

```text
× defaults visibility to private when omitted
  → expected undefined to be 'private'
```

### GREEN

A second entity now needs the visibility type, so sharing it is justified (a real second consumer
has appeared — not speculation). New `src/domain/visibility.ts`:

```ts
export type Visibility = "public" | "private" | "gated";
export const DEFAULT_VISIBILITY: Visibility = "private";
```

`createLogEntry` gains `visibility: input.visibility ?? DEFAULT_VISIBILITY`. The default const names
the prime directive's intent in one place: privacy is the default, publishing is the deliberate act.

```text
 Tests  32 passed (32)
```

### REFACTOR (consolidate the visibility vocabulary)

`work-item.ts` had its own identical `WorkItemVisibility = "public" | "private" | "gated"`. With a
second entity, that's duplication. Pointed `work-item.ts` at the shared `Visibility` and
`DEFAULT_VISIBILITY`, deleting `WorkItemVisibility` (it was only used internally — grep-confirmed).
Now there is exactly **one** visibility type and **one** default, ready for the gate to treat every
entity identically. Full suite still green (32).

## State after this cycle

- Tests: **32 passing (11 files)**. Suite green.
- Two of three entities are private-by-default; one shared `Visibility` vocabulary.

## Next candidate behaviors

- [ ] series is private by default (the last entity) — note this *overrides* legacy's default-public
      for series.
- [ ] generalize the privacy gate to one entity-agnostic `selectPublic` (enforce visibility once).
