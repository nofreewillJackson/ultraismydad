# Rebuild this app, explained like you're a person (not a compiler)

Hey. Read this first. It's the friendly version.

## First, the thing you actually need to hear

You are not slow. You are not dumb. You're reading documents that were written for
*architects and AI agents* — `CLEANROOM_SPEC.md` literally talks to itself in mermaid
diagrams. Of course it feels like wading through wet concrete. Feeling slow here isn't a
you-problem, it's a *the-material-is-dense* problem. Different thing.

Also: the whole point of the way we're building this (one tiny test at a time) is that you
**never** have to hold the whole app in your head. If you ever feel like you should "just
understand all of it" — you shouldn't, and nobody does, including me. We're going to eat this
elephant one bite at a time, on purpose.

So if you take nothing else from this doc: **slow is the correct speed.** Going slow and
actually understanding one small thing beats going fast and copying code you don't get.

---

## What are we even building?

A personal "build-in-public" website. One person ships projects, videos, research, and little
log entries over time. The site catalogs all of it and shows it off as a fast public website.
That's it. That's the app.

There's already a **finished version** of it sitting on your machine:

```
~/dev/projects/artluai-pre-cleanroom
```

That's your **answer key.** It works. It's messy inside (that's why we're rebuilding it
cleanly), but when you want to know "what is this thing *supposed* to do?", you can literally
run it and look.

We are NOT copying its code. We're rebuilding it *clean*, behavior by behavior, and using the
old one to check our answers.

---

## The mental model: two folders, one is the answer key

| | Where | What it is | What you do with it |
|---|---|---|---|
| **The old app** | `~/dev/projects/artluai-pre-cleanroom` | The finished, messy original | Run it, poke it, see how it behaves. Your answer key. |
| **Your rebuild** | this folder (`ultraismydad`) | Mostly empty. You're filling it in. | Where you write tests + code, one behavior at a time. |

For the current rebuild's data flow, read `APP_FLOW.md`. It explains how
`data/work-items.json` becomes static pages in `dist/`, where the privacy gate runs, and why
slug routing depends on normalizing JSON rows when they are read.

Try running the old one right now, just to see it's real:

```sh
cd ~/dev/projects/artluai-pre-cleanroom
npm install      # only the first time
npm run dev      # opens a local website
```

If it shows a website with some seed data, great. If it looks half-empty or warns about
missing data — that's fine, it normally pulls from a database you don't have. You're just
confirming it runs and seeing the *shape* of the thing.

---

## The one rule you cannot get wrong

There's exactly one rule in this whole app that, if you break it, is actually bad: **private
stuff must never show up on the public site.** Everything is "private" until someone
deliberately makes it "public." If you're ever unsure about a default, default to *hidden*.

That's why the very first code in your rebuild is the "privacy gate" — the bit that filters
out anything not marked public. It's already written. Good. That's the heart of the app and
it's done first on purpose.

Everything else is details. Nice details, lots of them, but details.

---

## The loop you'll repeat forever (this is the whole job)

We build with **TDD** — test-driven development. It sounds fancy. It's actually just a calm
little loop that protects you from ever being lost:

1. **RED** — pick ONE small thing the app should do. Write a tiny test that says "it should do
   X." Run it. Watch it **fail.** (It fails because you haven't built X yet. Good. That's the
   point.)
2. **GREEN** — write the *smallest* amount of code that makes that test pass. Not the elegant
   version. Not the future-proof version. The dumbest thing that works. Run it. Watch it
   **pass.**
3. **REFACTOR** — now that it works, tidy it up *without changing what it does*. Run the tests
   again to confirm you didn't break anything.

Then you pick the next small thing and do it again. That's it. That's the job. Forever.

Your test command in this folder:

```sh
npm test
```

Why this is great for someone who feels overwhelmed: **you are never holding more than one
small idea at a time.** The test you just wrote is the only thing you have to think about. The
rest of the app waits patiently. You literally cannot get lost, because at every moment
there's exactly one red test telling you what to do next.

> The strict rules behind this live in the TDD playbook (in the knowledge base). You don't
> need to memorize them. The 3-step loop above is 90% of it.

---

## Where do I get the list of "small things to build"?

You don't have to invent them. There's a checklist already written for you:
**`BEHAVIOR_INVENTORY.md`.** Every checkbox in it is one trip around the RED→GREEN→REFACTOR
loop. Things like:

- [ ] "gives an untitled work item the title 'untitled project'"
- [ ] "hides a log entry marked private"
- [ ] "computes the current day number from the start date"

See how small each one is? That's the size of bite you're taking. One checkbox = one test =
one little win.

When you finish one, you tick it and grab the next. The feeling of ticking boxes is the
point. It's proof you're moving even on days your brain feels like soup.

---

## The map: what order to build, in human terms

This is the same plan as `ROADMAP.md`, just said like a person. Each "stage" is a pile of
checkboxes from the inventory.

**Stage 1 — The rules in your head, as pure code.** (You're here.)
The boring-but-load-bearing logic: defaults, privacy filter, turning a title into a URL slug,
counting days. No website yet, no database — just little functions and tests. This is where
you build confidence because everything is small and fast.
*Done when:* the basic rules from the inventory's sections A, E, F, N all have passing tests.

**Stage 2 — Prove one full slice works end-to-end.**
Take ONE work item: save it, run it through the privacy filter, show it on a page. The goal
isn't features, it's to prove your skeleton holds weight before you pile features on it.
*Done when:* you can save a public item and see it render, start to finish.

**Stage 3 — The "freeze it for the public" step.**
The app takes everything, strips out the private stuff, and produces one clean public bundle.
This is the privacy rule made into a real, tested gate.
*Done when:* a test proves no private record ever makes it into the public output.

**Stage 4 — The public website pages.**
The home view, the list, the project pages, the log, research, the feeds. Compare each page's
*behavior* against the old app. (Looks can come later — you're matching what it *does*.)
*Done when:* the pages in inventory sections G–K behave like the old site.

**Stage 5 — The admin (where you type stuff in).**
Logging in, creating/editing items, marking them public. New stuff defaults to private.
*Done when:* you can author an item and publish it.

**Stage 6 — Videos.** The pipeline that turns raw video files into clean video pages.

**Stage 7 — The "digital garden."** The interlinked-notes section. It's its own little world
and doesn't depend on the rest, so you can do it whenever it sounds fun.

You do NOT need to understand stages 4–7 right now. Genuinely forget they exist until stage 1
and 2 feel comfortable.

---

## How to check you're on the right track

Whenever you're unsure what the *right* behavior is:

1. **Look it up in `DOMAIN_PRIMER.md`** — it explains the rules and even points at the exact
   line in the old code (`file:line`) where each rule lives.
2. **Run the old app** and watch it do the thing.
3. Write your test to match that behavior, then build it.

The old app is the source of truth for *what it does*. The cleanroom docs are the source of
truth for *what to keep vs. throw away*. You bounce between them.

⚠️ One heads-up: `CLEANROOM_SPEC.md` is opinionated and sometimes **overconfident** — it
labels a few things "accident, delete it" that actually aren't. We already caught two (the
"bake" and the "catch-all" — see its Correction notice at the top, and `ROADMAP.md` §2). So
when that doc says "do not port this," treat it as *"double-check this,"* not gospel. Trust
`DOMAIN_PRIMER.md` and the running old app over the spec's hot takes.

---

## Your literal next three sittings (an on-ramp)

Don't plan past these. Just do them.

**Sitting 1 — get comfortable, change nothing.**
- Run `npm test` in this folder. Watch the 3 existing tests pass.
- Open `tests/work-item.test.ts` and `src/domain/work-item.ts`. Read them. They're tiny. You
  already understand more than you think.
- Open `docs/dev-log/` and read the first log — it replays the exact baby steps already taken.

**Sitting 2 — do ONE new loop.**
- Open `BEHAVIOR_INVENTORY.md`, section A. Pick: *"gives an untitled work item the title
  'untitled project'"*.
- Write a failing test for it. Run `npm test`. **See it fail.** (This is the part that feels
  weird and is actually the most important part — you're allowed to write code that fails on
  purpose.)
- Make it pass with the smallest change. Run `npm test`. See it pass. Tick the box.
- That's a complete unit of work. You did the whole job, just small. Stop if you want.

**Sitting 3 — do it again, slightly braver.**
- Pick another section-A checkbox (the slug one is a good next bite).
- Same loop. RED, GREEN, tidy.

After three of these, the rhythm starts to feel normal, and "normal" is the goal.

---

## When you feel stuck or stupid (you won't be, but when it *feels* like it)

- **Lost?** Run `npm test`. The failing test is a literal to-do list of exactly one item.
  There is no "what do I do now" — the red test tells you.
- **Don't know the right behavior?** It's in `DOMAIN_PRIMER.md` or in the running old app.
  You're allowed to go look. Looking things up isn't cheating, it's the job.
- **A test won't pass after a few tries?** Stop. Don't thrash. Write down: what you're trying,
  what the error says, what you've tried. Bring me that. Half the time writing it down shows
  you the answer; the other half I can unstick you in one message.
- **Brain is soup today?** Do one checkbox. One. Then stop, guilt-free. One box a day still
  finishes this.
- **Feeling like everyone else gets this faster?** They don't, and "faster" isn't the metric.
  The metric is: do you understand the thing you just built? If yes, you're winning.

---

## Cheat sheet

```sh
# your rebuild (this folder)
npm test                 # run all your tests — your compass
npm run test:watch       # auto-reruns tests as you type (nice for the loop)

# the answer key (the old, finished app)
cd ~/dev/projects/artluai-pre-cleanroom
npm run dev              # run the old site and watch how it behaves
```

**The docs, ranked by how human-friendly they are:**
1. *This file* — start here.
2. `ROADMAP.md` — the plan with reasoning.
3. `BEHAVIOR_INVENTORY.md` — your checklist of small bites.
4. `DOMAIN_PRIMER.md` — what each rule means + where it lives in the old code.
5. `TECH_STACK.md` — the nerdy physical details (read when needed, not now).
6. `CLEANROOM_SPEC.md` — the big architectural one. Useful but opinionated; read its
   Correction notice first.

You've got this. One red test at a time.
