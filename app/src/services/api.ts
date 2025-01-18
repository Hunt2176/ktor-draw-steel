import { CampaignDetails, Character } from "src/types/models.ts";

export async function fetchCampaigns(): Promise<CampaignDetails[]> {
	const res = await fetch('/api/campaigns')
	return (await res.json()) as CampaignDetails[]
}

export async function fetchCampaign(id: number): Promise<CampaignDetails> {
	const res = await fetch(`/api/campaigns/${id}`)
	return (await res.json()) as CampaignDetails
}

export async function fetchCharacter(id: number): Promise<Character> {
	const res = await fetch(`/api/characters/${id}`)
	return (await res.json()) as Character
}

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