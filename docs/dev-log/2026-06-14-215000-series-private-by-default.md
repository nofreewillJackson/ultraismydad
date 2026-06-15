# 2026-06-14 21:50:00 - Cycle 33: A Series Is Private By Default (overrides legacy)

The third and last entity gets the prime-directive default. Now **every** thing the system can publish
is born private.

## The deliberate override

This is the sharpest divergence from legacy in the privacy work. `DOMAIN_PRIMER §4.3`: product lines,
series, and technologies are *shown unless `visibility === "private"`* — a **missing value means
public**. The defaults file sets them all `"public"`.

The rebuild reverses that. AGENTS §4: one uniform rule, default-deny. A series with no visibility set
is **private**. The justification is the prime directive itself: a single uniform default-to-hidden is
the only rule that can't leak by omission. Legacy's "series default public" is exactly the kind of
per-collection special case that makes privacy hard to reason about — the inconsistency we are here to
remove. (Re-derived, not cargo-culted: the primer documents default-public, and we are consciously
choosing not to port it.)

## Cycle 33

### RED

```ts
const series = createSeries({ id: "aninews" });
expect(series.visibility).toBe("private");
```

```text
× defaults visibility to private when omitted
  → expected undefined to be 'private'
```

### GREEN

`series.ts` imports the shared `Visibility` / `DEFAULT_VISIBILITY` (Cycle 32) and adds
`visibility: input.visibility ?? DEFAULT_VISIBILITY`. No new type, no second default — the third
entity simply joins the one vocabulary. That reuse is the payoff of consolidating in Cycle 32.

```text
 Tests  33 passed (33)
```

### REFACTOR

None.

## State after this cycle

- Tests: **33 passing (11 files)**. Suite green.
- All three entities (work item, log entry, series) are private-by-default on one `Visibility` type.
- "Private by default" is now total. The other half of the prime directive — **one** enforcement
  point — is next: a single entity-agnostic gate.

## Next candidate behaviors

- [ ] generalize the privacy gate: one `selectPublic` that excludes non-public items of any entity,
      with the single `=== "public"` decision living in exactly one place. Route the work-item path
      through it so there is never a second visibility decider.
