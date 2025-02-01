import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import useWebSocket from "react-use-websocket";
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