#!/usr/bin/env node
// @ts-check
/**
 * seed-campaigns.mjs — Seed the ktor-draw-steel app with sample data via its REST API.
 *
 * Creates a set of Draw Steel campaigns and, by default, the players (users) and
 * heroes (characters) that populate them. Talks only to the public HTTP API
 * (POST /api/campaigns, /api/users, /api/characters) — the same endpoints the
 * web UI uses — so it works against any running instance.
 *
 * Usage:
 *   node seed-campaigns.mjs                       # seed campaigns + heroes on localhost:8080
 *   node seed-campaigns.mjs --campaigns-only      # seed only the campaigns
 *   node seed-campaigns.mjs --url http://host:port
 *   node seed-campaigns.mjs --dry-run             # show what would be created, change nothing
 *   SEED_BASE_URL=http://localhost:8081 node seed-campaigns.mjs
 *
 * Idempotent: re-running skips campaigns, users, and heroes that already exist
 * (matched by name), so it is safe to run repeatedly.
 *
 * Requires Node 18+ (uses the built-in global fetch).
 */

const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(`--${name}`);
const getOpt = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

if (hasFlag('help') || hasFlag('h')) {
	console.log(
		[
			'Seed Draw Steel campaigns via the REST API.',
			'',
			'Options:',
			'  --url <base>        API base URL (default: $SEED_BASE_URL or http://localhost:8080)',
			'  --campaigns-only    Seed only campaigns (skip users and heroes)',
			'  --dry-run           Print planned actions without writing anything',
			'  --help              Show this help',
		].join('\n'),
	);
	process.exit(0);
}

const BASE = String(getOpt('url', process.env.SEED_BASE_URL || 'http://localhost:8080')).replace(/\/+$/, '');
const API = `${BASE}/api`;
const CAMPAIGNS_ONLY = hasFlag('campaigns-only');
const DRY_RUN = hasFlag('dry-run');

// ── Seed data ────────────────────────────────────────────────────────────────
// Each campaign optionally carries `heroes`. A hero's `player` maps to a user
// (created on demand and shared across heroes); everything else maps directly to
// the Character model fields the API accepts.
const CAMPAIGNS = [
	{
		name: 'The Fall of Capital Vasloria',
		heroTokens: 3,
		background:
			'The shining capital has fallen to the Ardent Legion. A scattered band of heroes ' +
			'must rally the resistance from the catacombs beneath the ruined city.',
		heroes: [
			{ name: 'Kael Ironward', player: 'Alex', resourceName: 'Wrath',
			  might: 2, agility: 0, reason: -1, intuition: 1, presence: 2, maxHp: 21, maxRecoveries: 8 },
			{ name: 'Sister Venna', player: 'Priya', resourceName: 'Piety',
			  might: 0, agility: 1, reason: 1, intuition: 2, presence: 2, maxHp: 18, maxRecoveries: 10 },
			{ name: 'Dax Quickfingers', player: 'Sam', resourceName: 'Insight',
			  might: -1, agility: 2, reason: 2, intuition: 1, presence: 0, maxHp: 16, maxRecoveries: 8 },
		],
	},
	{
		name: 'Echoes of the Timescape',
		heroTokens: 2,
		background:
			'Reality is fraying at the edges of the Timescape. The heroes chase a Time Raider ' +
			'warband across collapsing eras to seal the breaches before history unravels.',
		heroes: [
			{ name: 'Threnody', player: 'Priya', resourceName: 'Drama',
			  might: 0, agility: 1, reason: 2, intuition: 1, presence: 2, maxHp: 18, maxRecoveries: 8 },
			{ name: 'Grond Stonefist', player: 'Sam', resourceName: 'Ferocity',
			  might: 2, agility: 1, reason: 0, intuition: 0, presence: 1, maxHp: 24, maxRecoveries: 10 },
		],
	},
	{
		name: 'Reach of the Tarkanan',
		heroTokens: 1,
		background:
			'A thieves’ guild known as the Tarkanan has its hooks in every ward of the free city. ' +
			'The heroes are hired to cut those hooks out — one warehouse, one informant, one rooftop chase at a time.',
		heroes: [
			{ name: 'Vex Nightshade', player: 'Alex', resourceName: 'Insight',
			  might: -1, agility: 2, reason: 1, intuition: 2, presence: 1, maxHp: 16, maxRecoveries: 8 },
			{ name: 'Mira Brightblade', player: 'Sam', resourceName: 'Focus',
			  might: 1, agility: 2, reason: 0, intuition: 1, presence: 1, maxHp: 20, maxRecoveries: 9 },
		],
	},
	{
		name: 'The Hollow Crown',
		heroTokens: 0,
		background:
			'The old king is dead and his crown sits empty. Five claimants, five armies, and one ' +
			'prophecy bind the realm to the heroes who must decide who — if anyone — should rule.',
		heroes: [
			{ name: 'Lord Aldric Vane', player: 'Priya', resourceName: 'Discipline',
			  might: 1, agility: 0, reason: 2, intuition: 1, presence: 2, maxHp: 20, maxRecoveries: 8 },
		],
	},
	{
		name: 'Songs of the Quintessence',
		heroTokens: 5,
		background:
			'Deep beneath the world hums the Quintessence, the elemental wellspring of all magic. ' +
			'When its song falters, the heroes descend to mend the source before the surface withers.',
		heroes: [
			{ name: 'Ember', player: 'Alex', resourceName: 'Essence',
			  might: 0, agility: 1, reason: 2, intuition: 2, presence: 1, maxHp: 17, maxRecoveries: 8 },
			{ name: 'Tirian Vale', player: 'Priya', resourceName: 'Clarity',
			  might: 1, agility: 1, reason: 1, intuition: 2, presence: 1, maxHp: 19, maxRecoveries: 9 },
		],
	},
];

// ── API helpers ──────────────────────────────────────────────────────────────
async function api(method, path, body) {
	let res;
	try {
		res = await fetch(`${API}${path}`, {
			method,
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch (err) {
		throw new Error(
			`Cannot reach ${API}${path} (${err.message}).\n` +
				`Is the server running? Try: pnpm --filter @draw-steel/server dev`,
		);
	}
	const text = await res.text();
	let data = null;
	if (text) {
		try { data = JSON.parse(text); } catch { data = text; }
	}
	if (!res.ok) {
		const detail = typeof data === 'string' ? data : JSON.stringify(data);
		throw new Error(`${method} ${path} → HTTP ${res.status}: ${detail}`);
	}
	return data;
}

const log = {
	created: (what) => console.log(`  + ${what}`),
	skipped: (what) => console.log(`  = ${what} (already exists)`),
	plan: (what) => console.log(`  ~ would create ${what}`),
};

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
	console.log(`Seeding ${BASE}${DRY_RUN ? '  (dry run — no writes)' : ''}`);
	console.log(CAMPAIGNS_ONLY ? 'Mode: campaigns only\n' : 'Mode: campaigns + players + heroes\n');

	// Existing campaigns: GET /api/campaigns returns [{ campaign, characters, entries }, ...]
	const details = await api('GET', '/campaigns');
	const campaignIdByName = new Map(details.map((d) => [d.campaign.name, d.campaign.id]));

	// Existing users + characters (only needed when seeding heroes).
	const userIdByName = new Map();
	const seenCharacter = new Set(); // key: `${campaignId}::${name}`
	if (!CAMPAIGNS_ONLY) {
		for (const u of await api('GET', '/users')) userIdByName.set(u.name, u.id);
		for (const c of await api('GET', '/characters')) seenCharacter.add(`${c.campaign}::${c.name}`);
	}

	const counts = { campaigns: 0, users: 0, heroes: 0 };

	async function ensureUser(name) {
		if (userIdByName.has(name)) return userIdByName.get(name);
		if (DRY_RUN) { log.plan(`player "${name}"`); userIdByName.set(name, -1); counts.users++; return -1; }
		const u = await api('POST', '/users', { name });
		userIdByName.set(name, u.id);
		counts.users++;
		log.created(`player "${name}" (id ${u.id})`);
		return u.id;
	}

	for (const c of CAMPAIGNS) {
		const { heroes = [], ...campaignBody } = c;

		// Campaign
		let campaignId = campaignIdByName.get(c.name);
		if (campaignId != null) {
			log.skipped(`campaign "${c.name}"`);
		} else if (DRY_RUN) {
			log.plan(`campaign "${c.name}" (heroTokens ${c.heroTokens})`);
			counts.campaigns++;
		} else {
			const created = await api('POST', '/campaigns', campaignBody);
			campaignId = created.id;
			campaignIdByName.set(c.name, campaignId);
			counts.campaigns++;
			log.created(`campaign "${c.name}" (id ${campaignId})`);
		}

		if (CAMPAIGNS_ONLY) continue;

		// Heroes for this campaign
		for (const h of heroes) {
			const key = `${campaignId}::${h.name}`;
			if (campaignId != null && seenCharacter.has(key)) {
				log.skipped(`hero "${h.name}"`);
				continue;
			}
			const userId = await ensureUser(h.player);
			if (DRY_RUN) {
				log.plan(`hero "${h.name}" in "${c.name}"`);
				counts.heroes++;
				continue;
			}
			const { player, ...stats } = h;
			const created = await api('POST', '/characters', {
				...stats,
				campaign: campaignId,
				user: userId,
			});
			seenCharacter.add(`${campaignId}::${h.name}`);
			counts.heroes++;
			log.created(`hero "${h.name}" (id ${created.id}) in "${c.name}"`);
		}
	}

	console.log(
		`\nDone. ${DRY_RUN ? 'Would create' : 'Created'} ` +
			`${counts.campaigns} campaign(s), ${counts.users} player(s), ${counts.heroes} hero(es).`,
	);
	if (!DRY_RUN) console.log(`View them at ${BASE}/`);
}

main().catch((err) => {
	console.error(`\nSeed failed: ${err.message}`);
	process.exit(1);
});
