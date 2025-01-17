import { Campaign, Character } from "src/types/models.ts";

export async function fetchCampaigns(): Promise<Campaign[]> {
	const res = await fetch('/api/campaigns')
	return (await res.json()) as Campaign[]
}

export async function fetchCampaign(id: number): Promise<CampaignDetails> {
	const campaignResp = await fetch(`/api/campaigns/${id}`);
	const campaign = await campaignResp.json() as Campaign;
	
	const characterResp = await fetch(`/api/campaigns/${id}/characters`);
	const characters = await characterResp.json() as Character[];
	return { campaign, characters };
}

export type CampaignDetails = { campaign: Campaign, characters: Character[] };

export async function saveCharacter(id: number, character: Partial<Character>) {
	const res = await fetch(`/api/characters/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(character),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to save character');
	}
	
}