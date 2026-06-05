#!/usr/bin/env node
/*
 * Seed the Draw Steel database with example campaigns/characters/combats so the
 * app has something to show. It talks to the RUNNING server over HTTP, so:
 *
 *   1. Start the app first:   pnpm build && pnpm start      (serves on PORT, default 8080)
 *   2. In another terminal:   pnpm seed                     (or: node apps/server/seed.mjs)
 *
 * Point it at a different host/port with the BASE env var, e.g.
 *   BASE=http://localhost:2222 pnpm seed
 *
 * Re-running APPENDS another copy of the sample data (it does not reset the DB).
 */

const BASE = process.env.BASE ?? 'http://localhost:8080';

async function post(path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `Could not reach the server at ${BASE}. Is it running? (pnpm start)\n  ${e.message}`,
    );
  }
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const char = (campaign, o) => post('/api/characters', { campaign, user: 1, ...o });
const condition = (character, name, endType) =>
  post('/api/characterConditions', { character, name, endType });
const item = (character, name, quantity) =>
  post('/api/inventoryItem', { character, name, quantity });
const entry = (campaign, o) => post('/api/displayEntry', { campaign, ...o });

async function main() {
  console.log(`Seeding ${BASE} ...`);

  // ---------------------------------------------------------------- Campaign 1
  const c1 = await post('/api/campaigns', { name: 'Shadow of the Spire', heroTokens: 3 });
  const rin = await char(c1.id, {
    name: 'Rin Valebrook', might: 2, agility: 2, reason: -1, intuition: 1, presence: 0,
    maxHp: 24, removedHp: 6, maxRecoveries: 8, victories: 3, resourceName: 'Clarity',
  });
  const brakka = await char(c1.id, {
    name: 'Brakka Ironhide', might: 3, agility: 0, reason: 0, intuition: 1, presence: -1,
    maxHp: 30, maxRecoveries: 10, victories: 3, resourceName: 'Ferocity',
  });
  const mireille = await char(c1.id, {
    name: 'Sister Mireille', might: 0, agility: 1, reason: 1, intuition: 2, presence: 2,
    maxHp: 21, removedHp: 3, temporaryHp: 4, maxRecoveries: 8, victories: 3, resourceName: 'Piety',
  });
  await char(c1.id, {
    name: 'Goblin Cutters', maxHp: 24, removedHp: 8, minions: 6, maxRecoveries: 0,
  });
  await char(c1.id, {
    name: 'Spire Warden', might: 4, agility: 1, reason: 0, intuition: 2, presence: 1,
    maxHp: 80, removedHp: 20, maxRecoveries: 6,
  });

  await condition(rin.id, 'Bleeding', 'save');
  await condition(brakka.id, 'Taunted', 'endOfTurn');
  await condition(mireille.id, 'Frightened', 'save');

  await item(rin.id, 'Healing Potion', 2);
  await item(rin.id, 'Climbing Kit', 1);
  await item(brakka.id, 'Trail Rations', 5);
  await item(brakka.id, 'Throwing Axe', 3);

  await post('/api/combats/create', {
    campaign: c1.id,
    characters: [rin.id, brakka.id, mireille.id],
  });

  await entry(c1.id, {
    title: 'The Spire Warden',
    description:
      'A towering construct of black iron that guards the upper sanctum. It does not tire, and it does not forgive.',
    type: 'Portrait',
    pictureUrl: null,
  });
  await entry(c1.id, {
    title: 'Throne Room of Ash',
    description: 'Cinders drift through the broken vault above the obsidian throne.',
    type: 'Background',
    pictureUrl: null,
  });

  // ---------------------------------------------------------------- Campaign 2
  const c2 = await post('/api/campaigns', { name: 'Embers of the Deep', heroTokens: 1 });
  await char(c2.id, {
    name: 'Talia Emberwright', might: 0, agility: 2, reason: 2, intuition: 1, presence: 1,
    maxHp: 22, maxRecoveries: 8, victories: 1, resourceName: 'Drama',
  });
  await char(c2.id, {
    name: 'Durgan Stonefist', might: 3, agility: 1, reason: -1, intuition: 0, presence: 0,
    maxHp: 28, removedHp: 10, maxRecoveries: 10, victories: 1, resourceName: 'Wrath',
  });
  await char(c2.id, { name: 'Cult Acolytes', maxHp: 16, minions: 4, maxRecoveries: 0 });

  // ---------------------------------------------------------------- Campaign 3
  const c3 = await post('/api/campaigns', { name: 'The Hollow Crown', heroTokens: 5 });
  await char(c3.id, {
    name: 'Wisp', might: -1, agility: 2, reason: 1, intuition: 2, presence: 1,
    maxHp: 18, maxRecoveries: 6, resourceName: 'Insight',
  });
  await char(c3.id, {
    name: 'Lord Castellan', might: 2, agility: 0, reason: 2, intuition: 1, presence: 3,
    maxHp: 60, removedHp: 15, maxRecoveries: 8, offstage: true,
  });

  // ----------------------------------------------------------------- summary
  const campaigns = await (await fetch(BASE + '/api/campaigns')).json();
  console.log('\nSeeded campaigns:');
  for (const d of campaigns) {
    console.log(`  #${d.campaign.id} ${d.campaign.name} — heroTokens ${d.campaign.heroTokens}`);
  }
  console.log('\nDone. Open the app and visit /campaigns.');
}

main().catch((e) => {
  console.error('\nSeed failed:\n' + e.message);
  process.exit(1);
});
