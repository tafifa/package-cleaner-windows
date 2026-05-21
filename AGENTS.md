# AGENTS Guide

This guide is for both human collaborators and coding agents working in this repository.

## Goal

- Keep changes small, focused, and safe.
- Preserve UX quality and consistency.
- Avoid regressions in PackClean core behavior.

## Mandatory Rules

1. **Always share a short implementation plan before editing files.**
2. **Use small, focused commits** (one change batch = one commit).
3. **Do not change core scanner/delete/reinstall behavior** without explicit approval.
4. **Delete must remain Recycle Bin based** (`shell.trashItem`), never hard delete.
5. **Do not revert unrelated user changes.**
6. **Do not run destructive git commands** (`reset --hard`, etc.) without permission.

## v1 Scope

Current priorities:

- UX clarity
- Visual consistency
- Action safety
- Stability

Out-of-scope without explicit approval:

- Large architectural rewrites
- Framework/state-management migration
- Full scanner redesign

## Coding Conventions

- Language: JavaScript (not TypeScript)
- Styling: custom CSS variables
- Keep code readable: small functions, clear names, minimal comments
- Keep baseline accessibility:
  - visible keyboard focus
  - clear disabled states
  - sufficient text contrast

## UI/UX Conventions

- Use size statuses: `EMPTY`, `SMALL`, `MEDIUM`, `LARGE`, `INACTIVE`
- Status colors must stay consistent across:
  - label text
  - status dot
  - progress bar
- Bulk actions should stay in the floating action bar.

## Commit Message Style

Use the following prefixes:

- `feat: ...` for new features
- `refactor: ...` for structural/UX improvements without core behavior change
- `fix: ...` for bug fixes
- `docs: ...` for documentation

Examples:

- `feat: add in-app delete confirmation modal with path preview`
- `refactor: optimize v1 layout hierarchy and bulk action ux`

## Documentation Maintenance

When behavior changes, update these files as needed:

- `README.md` (usage flow / scripts / feature notes)
- `CHANGELOG.md` (version entries)
- `TODO.md` (current status and next priorities)

## Done Criteria

A change is complete when:

1. Task scope is fully implemented.
2. No unrelated files were modified.
3. Commit is created.
4. A short change summary is provided.
