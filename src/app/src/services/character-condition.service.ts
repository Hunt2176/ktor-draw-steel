import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CharacterCondition } from '@app-types/models';

export type CharacterConditionUpdate = {
	name: string;
	character: number;
	endType: 'endOfTurn' | 'save';
};

@Injectable({
	providedIn: 'root',
})
export class CharacterConditionService {
	private readonly http = inject(HttpClient);

	addCharacterCondition(update: CharacterConditionUpdate) {
		return this.http.post<CharacterCondition>(
			'/api/characterConditions',
			update
		);
	}

	deleteCharacterCondition(id: number) {
		return this.http.delete(`/api/characterConditions/${id}`);
	}
}
