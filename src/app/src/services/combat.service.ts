import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Combat } from '@app-types/models';

export type CreateCombatUpdate = {
	campaign: number;
	characters: number[];
};

export type CombatRoundUpdate = {
	fromRound: number;
	reset: boolean;
	updateConditions: boolean;
};

export type CombatModificationUpdate = {
	add?: number[];
	remove?: number[];
};

export type CombatantQuickAddUpdate = {
	character: {
		name: string;
		maxHp: number;
		user: number;
		offstage: boolean;
	};
};

export type CombatCombatantUpdate = {
	character: number;
};

@Injectable({
	providedIn: 'root',
})
export class CombatService {
	private readonly http = inject(HttpClient);

	fetchCombatsFor(id: number) {
		return this.http.get<Combat[]>(`/api/campaigns/${id}/combats`);
	}

	fetchCombat(id: number) {
		return this.http.get<Combat>(`/api/combats/${id}`);
	}

	createCombat(update: CreateCombatUpdate) {
		return this.http.post<Combat>('/api/combats/create', update);
	}

	deleteCombat(id: number) {
		return this.http.delete(`/api/combats/${id}`);
	}

	updateCombatRound(id: number, update: CombatRoundUpdate) {
		return this.http.patch<Combat>(`/api/combats/${id}/nextRound`, update);
	}

	quickAddCombatant(id: number, update: CombatantQuickAddUpdate) {
		return this.http.patch<Combat>(`/api/combats/${id}/quickAdd`, update);
	}

	updateCombatCombatant(
		id: number,
		type: 'add' | 'remove',
		update: CombatCombatantUpdate
	) {
		return this.http.patch<Combat>(
			`/api/combats/${id}/${type}`,
			update
		);
	}

	updateCombatModification(id: number, update: CombatModificationUpdate) {
		return this.http.patch<Combat>(`/api/combats/${id}/modify`, update);
	}
}
