# Mobile ADR 001: Build and Release (EAS + GitHub Actions)

## Status

Accepted

## Context

The mobile app (Expo SDK 57) needs installable builds (APK for testers, store builds for production) and a CI/CD pipeline. Most changes are JavaScript-only and can reach users as over-the-air (OTA) updates; only changes to native code (new native module, Expo SDK upgrade, native config in `app.json`) need a new binary. The pipeline must decide this automatically.

## Decision

### EAS profiles (`mobile/eas.json`)

| Profile | Distribution | Android output | Channel | EAS environment | Use |
|---------|--------------|----------------|---------|-----------------|-----|
| `development` | internal | APK | `development` | `development` | Development build (`expo-dev-client`) |
| `preview` | internal | APK | `preview` | `preview` | Manual APK for testers |
| `production` | store | AAB | `production` | `production` | Play Store / App Store |

- `cli.appVersionSource: remote` — EAS stores the build number; `production` has `autoIncrement`
- App identifiers: `com.naregua.app` (Android `package` and iOS `bundleIdentifier`) — cannot change after the first store upload

### Build vs. OTA: fingerprint runtime version

- `app.json` uses `"runtimeVersion": { "policy": "fingerprint" }` — the runtime version is a hash of everything that affects native code
- A binary only accepts OTA updates with the same fingerprint, so an incompatible JS bundle can never reach an old binary
- `mobile/scripts/eas-deploy.mjs` runs per platform:
  1. `eas fingerprint:generate` for the profile
  2. `eas build:list --fingerprint-hash` — is there a build (new, queued, in progress or finished) with this fingerprint?
  3. Yes → `eas update` to the profile's channel (OTA). No → `eas build --no-wait` (the new build already contains the latest JS)
- The result (action, ID, fingerprint) is written to the GitHub job summary

We use our own script instead of `expo/expo-github-action/continuous-deploy-fingerprint` because that sub-action is marked "not yet ready for use". EAS Workflows (`.eas/workflows`) offer the same logic but would move the pipeline out of GitHub Actions.

### GitHub Actions (`.github/workflows/`)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `mobile-ci.yml` | PR touching `mobile/**`; called by `mobile-cd.yml` | `npm ci`, lint, typecheck, Jest |
| `mobile-cd.yml` | Push to `main` touching `mobile/**`, or manual | `ci` → `development` → `production` |
| `mobile-eas-deploy.yml` | Called by `mobile-cd.yml` | Reusable deploy job for one profile (runs `eas-deploy.mjs`) |

- One pipeline per merge: CI, then the `development` deploy, then the `production` deploy
- Each deploy job runs in the GitHub environment named after the profile. `production` has required reviewers, so the production deploy **waits for manual approval** in the run page; unapproved runs expire after 30 days
- Deploys use per-profile concurrency groups, so a pending production approval never blocks development deploys; a newer pending production deploy replaces an older one
- We chose this over tag-triggered releases for simplicity (single developer, frequent OTA releases). If versioned tags become useful, create them automatically when production starts a new build
- Platforms per environment come from repository variables `EAS_PLATFORMS_DEVELOPMENT` / `EAS_PLATFORMS_PRODUCTION` (default `android`; set to `android,ios` once Apple credentials exist)
- Builds are not submitted to the stores automatically yet (`eas submit` stays manual)

## Setup (one-time)

1. `cd mobile && npx eas-cli@latest login`
2. `npx eas-cli@latest init` — creates the EAS project and writes `extra.eas.projectId` to `app.json`
3. `npx eas-cli@latest update:configure` — writes `updates.url` to `app.json`
4. First build per profile/platform must run locally, because CI is non-interactive and cannot create credentials (Android keystore, Apple certificates):
   - `npx eas-cli@latest build -p android --profile preview` (first APK)
   - `npx eas-cli@latest build -p android --profile development`
   - `npx eas-cli@latest build -p android --profile production`
5. EAS environment variables (expo.dev → project → Environment variables): `EXPO_PUBLIC_API_URL` for `development`, `preview` and `production`
6. GitHub: create an access token at expo.dev (Account settings → Access tokens) and save it as the `EXPO_TOKEN` repository secret; create the `development` and `production` environments

## Consequences

- JS-only changes reach users in minutes via OTA; native changes automatically produce a new build
- A native change merged to `main` starts a new development build; testers must install it before receiving later updates
- iOS requires an Apple Developer account before enabling it in `EAS_PLATFORMS_*`
- Anything that changes the fingerprint (e.g. adding a config plugin, bumping the Expo SDK) will trigger a new build — this is expected
