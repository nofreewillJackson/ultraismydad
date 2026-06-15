# Behavior-Driven Development as a Build Strategy

A workflow for building (or rebuilding) any app by stating what it does before writing how it does it.

---

## The Core Idea

Most developers learn in this order:

1. Write code
2. Realize they need tests
3. Retrofit tests around existing code

The behavior-driven approach inverts this:

1. **State what the system does** (behaviors)
2. **Prove each behavior exists** (tests that fail first)
3. **Write the minimum code to make it true**

This isn't just a testing strategy — it's a product strategy. You are forced to articulate what you're building before you build it, which surfaces ambiguity early when it's cheap to resolve.

---

## The Loop (One Behavior at a Time)

**RED** — Pick one behavior. Write exactly one test. Run it and watch it fail. Confirm it fails for the right reason (missing behavior, not a typo or bad import).

**GREEN** — Write the smallest code that passes. No speculative structure. No adjacent behavior. Run the test, then the full suite.

**REFACTOR** — Tidy under green: names, duplication, placement. Re-run the full suite. Nothing new should break.

Repeat. Never write test + implementation in one step. Never skip the failing run.

---

## Building vs. Rebuilding

The loop is identical. The only difference is where your behaviors come from.

**When rebuilding:** you have an answer key (the existing app). You derive behaviors from what it already does, then decide which to keep vs. discard.

**When building from scratch:** you write the behaviors prospectively, from:
- A spec or design doc
- User stories
- Your own product intuition ("what should this do?")

Building from scratch is actually the cleaner case — you're not fighting legacy accidents at all.

---

## What a "Behavior" Is

A behavior is a discrete, observable thing the system does. Not an implementation detail — a user-facing or system-level fact.

Good behaviors:
- "A private item produces no output file in the build"
- "An untitled entry defaults to 'untitled entry'"
- "A slug truncates to 80 characters"

Bad behaviors (too implementation-specific):
- "The `slugify` function calls `.toLowerCase()`"
- "The store uses a JSON array"

If you can describe it without naming a function or file, it's probably a behavior.

---

## The Behavior Inventory

Before writing any code, write a flat checklist of every behavior the system needs. One line per behavior. This is your roadmap.

The inventory is also your progress tracker. Each checkbox is one TDD cycle. When all boxes are checked, the system is done (by definition — you stated what "done" means upfront).

Example format:
```
[ ] A work item is private by default
[ ] An untitled work item defaults to "untitled project"
[ ] A work item slug is derived from its title
[ ] A private item produces no page in the build
```

---

## Key Rules

**Rejection before happy path.** Write the test that proves the system rejects bad input *before* you write the test that proves it handles good input. This forces you to think about the boundary before you assume it away.

**Vertical slices, not horizontal layers.** Prove the thinnest path through the *entire* system before broadening any single layer. Build a feature end-to-end (input → storage → output) in one slice, even if it's minimal. This avoids building infrastructure that never gets used.

**Store relationships, derive presentation.** Anything that connects two things (a tag, a category, a series) should be stored explicitly. Anything that's a label, count, or display value should be computed on read. Never store what you can derive; never derive what you need to look up.

**One front door.** Business rules live in one place (the domain layer). Framework code, adapter code, and glue code do not contain decisions. If a rule exists in two places, one of them will drift.

---

## When to Use This

This workflow pays off when:
- You need to be confident the system does exactly what you think it does
- The project will be worked on by multiple people (or by you across multiple sessions)
- You're rebuilding something and need to avoid re-importing legacy accidents
- The correctness of the output matters (privacy, data integrity, financial logic)

It's slower upfront and faster overall. The tests become a living spec that tells any future contributor (or AI agent) exactly what the system is supposed to do.
