# CLAUDE.md

Project conventions live in `AGENTS.md` (shared with other AI tools). Keep that file as the single source of truth and put only Claude Code-specific notes here.

@AGENTS.md

## Claude Code Notes

- Before changing a module, read the ADRs listed under "Critical ADRs" in `AGENTS.md` that apply to it
- When a change affects the API contract, check both clients (`webapp/` and `mobile/`)
- When a decision changes, update the matching ADR (or create a new one) in the same change
- Run commands from inside the app's folder (`api/`, `webapp/`, `mobile/`) — there is no root `package.json`
- Commit messages use the prefix `[api]`, `[webapp]` or `[mobile]` followed by a conventional type (e.g. `[mobile] feat: login screen`)
