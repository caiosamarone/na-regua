#!/usr/bin/env node
/**
 * Decides, per platform, whether a change needs a new native build or can ship as an OTA update.
 *
 * The runtime version uses the "fingerprint" policy (app.json), so a build can only receive
 * updates whose fingerprint matches its own. For each platform we:
 *   1. compute the current fingerprint for the build profile;
 *   2. look for an EAS build of that profile with the same fingerprint (finished or in progress);
 *   3. if one exists → publish an OTA update to the profile's channel;
 *      otherwise → start a new build (which already contains the current JS).
 *
 * Usage: node scripts/eas-deploy.mjs --profile <development|preview|production> [--platforms android,ios]
 * Requires: eas-cli on PATH and EXPO_TOKEN in the environment.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

// Builds in these states will (or already do) run the current native code, so an update is enough
const USABLE_BUILD_STATUSES = new Set(['NEW', 'IN_QUEUE', 'IN_PROGRESS', 'FINISHED']);

const { values: args } = parseArgs({
  options: {
    profile: { type: 'string' },
    platforms: { type: 'string', default: 'android,ios' },
    message: { type: 'string' },
  },
});

if (!args.profile) {
  fail('Missing --profile');
}

const platforms = args.platforms.split(',').map((p) => p.trim()).filter(Boolean);
const { channel, environment } = resolveProfile(args.profile);
const message = args.message ?? git('log', '-1', '--pretty=%s');

const results = platforms.map((platform) => deploy(platform));
writeSummary(results);

function deploy(platform) {
  const { hash } = eas(['fingerprint:generate', '--platform', platform, '--build-profile', args.profile]);
  log(`[${platform}] fingerprint ${hash}`);

  const builds = eas([
    'build:list',
    '--platform', platform,
    '--build-profile', args.profile,
    '--fingerprint-hash', hash,
    '--limit', '10',
  ]);
  const compatibleBuild = builds.find((build) => USABLE_BUILD_STATUSES.has(build.status));

  if (compatibleBuild) {
    log(`[${platform}] build ${compatibleBuild.id} (${compatibleBuild.status}) matches → publishing OTA update`);
    const updates = eas([
      'update',
      '--platform', platform,
      '--channel', channel,
      '--environment', environment,
      '--message', message,
    ]);
    return { platform, hash, action: 'update', id: updates[0]?.group ?? updates[0]?.id };
  }

  log(`[${platform}] no build matches this fingerprint → starting a new build`);
  const [build] = eas(['build', '--platform', platform, '--profile', args.profile, '--no-wait']);
  return { platform, hash, action: 'build', id: build?.id };
}

function resolveProfile(name) {
  const easJson = JSON.parse(readFileSync(new URL('../eas.json', import.meta.url), 'utf8'));
  let profile = {};
  // Walk the "extends" chain so base values are overridden by the child profile
  for (let current = name; current; current = easJson.build[current]?.extends) {
    if (!easJson.build[current]) fail(`Build profile "${current}" not found in eas.json`);
    profile = { ...easJson.build[current], ...profile };
  }
  if (!profile.channel || !profile.environment) {
    fail(`Build profile "${name}" must define "channel" and "environment" in eas.json`);
  }
  return profile;
}

function eas(commandArgs) {
  const stdout = execFileSync('eas', [...commandArgs, '--json', '--non-interactive'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    // fingerprint:generate prints every hashed source, which easily exceeds the 1 MB default
    maxBuffer: 512 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { encoding: 'utf8' }).trim();
}

function writeSummary(rows) {
  const lines = [
    `### EAS deploy — \`${args.profile}\``,
    '',
    '| Platform | Action | ID | Fingerprint |',
    '| --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.platform} | ${r.action === 'build' ? '🏗️ new build' : '⚡ OTA update'} | ${r.id ?? '-'} | \`${r.hash}\` |`),
    '',
  ];
  const output = lines.join('\n');
  log(output);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, output);
  }
}

function log(text) {
  console.log(text);
}

function fail(text) {
  console.error(text);
  process.exit(1);
}
