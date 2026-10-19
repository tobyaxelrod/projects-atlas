# Project Atlas

A private project register with searchable cards, project families, two focus slots, a decision queue, dated system-health evidence, activity history, and cloud-saved notes.

## Features

- Work status is independent of runtime health; health shows both check and event timestamps.
- Verified links and source evidence are attached to projects. Coverage audit exposes missing links.
- Hide/Restore is independent of work status. Hidden cards leave main views, counts and focus; find them in the sidebar's Hidden menu.
- Projects, priorities, deadlines, notes, focus and visibility persist in Sites D1 across devices.
- Optimistic revision checks reject stale saves with HTTP 409. The editor retains unsaved text on failure.
- Existing browser-only edits can be imported by comparing against the original baseline; current audited evidence is retained for fields the user never changed.
- Recent changes records saves and audit events (latest 1,000 events). Export downloads the register and retained history.
- Sync reloads the saved register. It is **not** an external GitHub, chat or runtime audit.

## Public source versus private data

This public repository contains reusable application source and sample/empty seed data only. Personal project inventories, notes, private repository names, family details, credentials and deployment identity are excluded. The deployed private Site keeps its own source repository and database; this is a versioned code mirror, not automatic GitHub-to-Sites deployment.

## Development

Requires Node 24+ (the tests use built-in SQLite). Install dependencies using the Sites installer in a Sites environment, or `corepack pnpm install --frozen-lockfile` in a normal local checkout. Run `node --test tests/atlas.test.mjs` and `pnpm build`.

`app/route.ts` serves the interface; `public/app.js` contains browser interactions; `app/api/state/route.ts` performs validated revision-checked saves; `lib/model.ts` validates records. `db/schema.ts` and `drizzle/` declare the D1 schema.

Set `.openai/hosting.json` to the target Site ID with `d1: "DB"` before publishing through Sites. Keep the Site **owner-private**. The API relies on Sites dispatch for authenticated access, including service credentials; do not expose it on a public Site without adding application authorization. Cross-origin writes are rejected. No secrets are required in browser code.

Use the Sites starter workflow to generate and apply schema migrations. Do not alter already applied migrations. Seed records initialize only an empty database; updates to an existing register are made through the revision-checked API or UI.

## Verification and limits

Tests cover SQLite persistence, stale-write conflicts, cross-origin rejection, hide/restore state, cyclic parents, unsafe links, focus limits, browser-edit migration and UI rendering smoke checks. Browser visual QA is separate from these checks. Project health is a dated snapshot, not a continuous monitor. Missing links remain explicit rather than guessed.
