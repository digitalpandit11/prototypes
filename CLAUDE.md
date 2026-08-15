# Prototypes

A collection of standalone, frontend-only prototypes (cadmech-virtual-lab, radicals, vbtek,
vendor-onboarding). Each lives in its own folder and opens directly in a browser.

> ⚠️ **This repository is PUBLIC.** Never commit client names, real data, credentials or
> commercial detail here. Mock data must be obviously fictional.

## 📚 Read first

**`docs/knowledge/README.md`** — the shared stack and design system every prototype follows,
plus per-prototype notes. Distilled from machine-local memory on 2026-08-15.

## The stack, and why

**Vanilla HTML / CSS / JavaScript — no frameworks, no build tools.** Every prototype here follows
it, so they stay openable as plain files with nothing to install. Default to this unless the user
explicitly asks for React/Vue.

A shared glassmorphic design system (deep gradient background, blurred translucent cards, Poppins,
pill buttons) keeps them visually consistent — details in the notes.

## Keeping this useful

New prototype? Add a short note under `docs/knowledge/` covering what it is, its file structure
and where its state lives. That is what makes the next one quick to pick up.
