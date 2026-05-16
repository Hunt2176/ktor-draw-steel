import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from '@app/types/models';

export type ModifyCharacterHpUpdate = {
	mod: number;
	type: 'HEAL' | 'DAMAGE';
};

export type ModifyCharacterRecoveryUpdate = {
	mod: number;
	type: 'INCREASE' | 'DECREASE';
};

@Injectable({
	providedIn: 'root',
})
export class CharacterService {
	private readonly http = inject(HttpClient);

	fetchCharacter(id: number) {
		return this.http.get<Character>(`/api/characters/${id}`);
	}

	createCharacter(character: Partial<Character>) {
		return this.http.post<Character>('/api/characters', character);
	}

	saveCharacter(id: number, character: Partial<Character>) {
		return this.http.patch<Character>(`/api/characters/${id}`, character);
	}

	deleteCharacter(id: number) {
		return this.http.delete(`/api/characters/${id}`);
	}

	modifyCharacterHp(id: number, update: ModifyCharacterHpUpdate) {
		return this.http.patch<Character>(
			`/api/characters/${id}/modify/health`,
			update
		);
	}

	modifyCharacterRecovery(id: number, update: ModifyCharacterRecoveryUpdate) {
		return this.http.patch<Character>(
			`/api/characters/${id}/modify/recoveries`,
			update
		);
	}
}
