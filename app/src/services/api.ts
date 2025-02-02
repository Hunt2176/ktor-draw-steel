import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import useWebSocket from "react-use-websocket";
import { CampaignDetails, Character, CharacterCondition, Combat, Combatant } from "src/types/models.ts";

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

export async function createCharacter(character: Partial<Character>) {
	const res = await fetch(`/api/characters`, {
		method: 'POST',
		body: JSON.stringify(character),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to create character');
	}
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
	
	return (await res.json()) as Character;
}

export type ModifyCharacterHpUpdate = {
	mod: number;
	type: 'HEAL' | 'DAMAGE';
}
export async function modifyCharacterHp(id: number, update: ModifyCharacterHpUpdate): Promise<Character> {
	const res = await fetch(`/api/characters/${id}/modify/health`, {
		method: 'PATCH',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to modify character hp');
	}
	
	return (await res.json()) as Character;
}

export type ModifyCharacterRecoveryUpdate = {
	mod: number;
	type: 'INCREASE' | 'DECREASE';
}
export async function modifyCharacterRecovery(id: number, update: ModifyCharacterRecoveryUpdate): Promise<Character> {
	const res = await fetch(`/api/characters/${id}/modify/recoveries`, {
		method: 'PATCH',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to modify character recoveries');
	}
	
	return (await res.json()) as Character;
}


export type CharacterConditionUpdate = {
	name: string;
	character: number;
	endType: 'endOfTurn' | 'save';
}
export async function addCharacterCondition(update: CharacterConditionUpdate): Promise<CharacterCondition> {
	const res = await fetch(`/api/characterConditions`, {
		method: 'POST',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to add character condition');
	}
	
	return (await res.json()) as CharacterCondition;
}

export async function deleteCharacterCondition(id: number): Promise<void> {
	const res = await fetch(`/api/characterConditions/${id}`, {
		method: 'DELETE'
	});
	
	if (!res.ok) {
		throw new Error('Failed to delete character condition');
	}
}

export async function fetchCombat(id: number): Promise<Combat> {
	const res = await fetch(`/api/combats/${id}`)
	return (await res.json()) as Combat
}

export type CreateCombatUpdate = {
	campaignId: number;
	characterIds: number[];
}
export async function createCombat(update: CreateCombatUpdate): Promise<Combat> {
	const res = await fetch(`/api/combats/create`, {
		method: 'POST',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to create combat');
	}
	
	return (await res.json()) as Combat;
}

export type CombatRoundUpdate = {
	fromRound: number;
	reset: boolean;
}
export async function updateCombatRound(id: number, update: CombatRoundUpdate): Promise<Combat> {
	const res = await fetch(`/api/combats/${id}/nextRound`, {
		method: 'PATCH',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to update combat round');
	}
	
	return (await res.json()) as Combat;
}

export type CombatCombatantUpdate = {
	character: number;
}
export async function updateCombatCombatant(id: number, type: 'add' | 'remove', update: CombatCombatantUpdate): Promise<Combat> {
	const res = await fetch(`/api/combats/${id}/${type}`, {
		method: 'PATCH',
		body: JSON.stringify(update),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to update combatant');
	}
	
	return (await res.json()) as Combat;
}

export async function updateCombatantActive(id: number, available: boolean): Promise<Combatant> {
	const res = await fetch(`/api/combatants/${id}`, {
		method: 'PATCH',
		body: JSON.stringify({ available }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	
	if (!res.ok) {
		throw new Error('Failed to update combatant active');
	}
	
	return (await res.json()) as Combatant;
}